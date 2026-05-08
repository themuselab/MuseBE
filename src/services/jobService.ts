import path from "node:path";
import fs from "node:fs/promises";
import * as jobRepository from "../repositories/jobRepository";
import * as catalogModelRepository from "../repositories/catalogModelRepository";
import { adErrors } from "../errors/adErrors";
import { getAdGenerationQueue } from "../lib/queue";
import { overlayKoreanText } from "../lib/pilClient";
import { saveBuffer, getAbsolutePath } from "../lib/localStorage";
import { DEFAULT_OVERLAY_LAYOUT } from "../lib/openai";
import type { Job, Prisma } from "@prisma/client";

type StoredOverlay = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  textAlign: "left" | "center" | "right";
};

const isStoredOverlay = (v: unknown): v is StoredOverlay => {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.content === "string" &&
    typeof o.color === "string" &&
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.width === "number" &&
    typeof o.height === "number" &&
    typeof o.fontSize === "number" &&
    (o.fontWeight === "normal" || o.fontWeight === "bold") &&
    (o.textAlign === "left" || o.textAlign === "center" || o.textAlign === "right")
  );
};

const findOverlay = (
  arr: Prisma.JsonValue | null,
  id: string,
): StoredOverlay | null => {
  if (!Array.isArray(arr)) return null;
  for (const v of arr) {
    if (isStoredOverlay(v) && v.id === id) return v;
  }
  return null;
};

type JobWithCatalog = Job & {
  catalogModel: { id: string; name: string } | null;
};

const serializeJobListItem = (job: JobWithCatalog) => ({
  id: job.id,
  status: job.status,
  modelName: job.catalogModel?.name ?? null,
  catalogModelId: job.catalogModelId,
  item: job.item,
  resultUrl: job.resultUrl,
  baseImageUrl: job.baseImageUrl,
  createdAt: job.createdAt,
});

const UPLOADS_PUBLIC_PREFIX = "/uploads/";

const publicUrlToRelative = (url: string | null): string | null => {
  if (!url) return null;
  if (!url.startsWith(UPLOADS_PUBLIC_PREFIX)) return null;
  return url.slice(UPLOADS_PUBLIC_PREFIX.length);
};

const tryUnlinkPublicUrl = async (url: string | null): Promise<void> => {
  const rel = publicUrlToRelative(url);
  if (!rel) return;
  try {
    const abs = getAbsolutePath(rel);
    await fs.unlink(abs);
  } catch (err) {
    // 파일이 이미 없거나 권한 문제 — 삭제 자체는 막지 않음
    console.warn("[jobService] unlink failed", { url, err });
  }
};

const composePilSubhead = (
  subhead: string | null | undefined,
  _cta: string | null | undefined,
): string | undefined => {
  // CTA는 더 이상 이미지에 자동 합성하지 않음 — adGenerationService와 동기화.
  // 재편집(reOverlayText) 흐름도 동일하게 subhead만 PIL에 전달.
  return subhead ?? undefined;
};

type CreateJobInput = {
  userId: string;
  catalogModelId: string;
  prompt: string;
  headline?: string;
  subhead?: string;
  industry?: string;
  item?: string;
  extraDescription?: string;
  mood?: string;
  productImagePath?: string;
};

const serializeJob = (job: Job) => ({
  id: job.id,
  status: job.status,
  progress: job.progress,
  resultUrl: job.resultUrl,
  originalResultUrl: job.originalResultUrl,
  baseImageUrl: job.baseImageUrl,
  intermediateUrls: job.intermediateUrls,
  textOverlays: job.textOverlays,
  errorMessage: job.errorMessage,
  costCents: job.costCents,
  catalogModelId: job.catalogModelId,
  prompt: job.prompt,
  headline: job.headline,
  subhead: job.subhead,
  cta: job.cta,
  industry: job.industry,
  item: job.item,
  extraDescription: job.extraDescription,
  mood: job.mood,
  productImagePath: job.productImagePath,
  createdAt: job.createdAt,
  startedAt: job.startedAt,
  completedAt: job.completedAt,
});

export const createJob = async (input: CreateJobInput) => {
  const catalog = await catalogModelRepository.findById(input.catalogModelId);
  if (!catalog || !catalog.isActive) {
    throw adErrors.catalogModelNotFound();
  }

  const job = await jobRepository.createJob({
    userId: input.userId,
    catalogModelId: input.catalogModelId,
    prompt: input.prompt,
    headline: input.headline,
    subhead: input.subhead,
    industry: input.industry,
    item: input.item,
    extraDescription: input.extraDescription,
    mood: input.mood,
    productImagePath: input.productImagePath,
  });

  await getAdGenerationQueue().add(
    "generate",
    { jobId: job.id },
    { jobId: job.id },
  );

  return {
    jobId: job.id,
    status: job.status,
    estimatedSeconds: 60,
    pollUrl: `/ads/jobs/${job.id}`,
  };
};

export const getJobForUser = async (jobId: string, userId: string) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw adErrors.jobNotFound();
  if (job.userId !== userId) throw adErrors.jobForbidden();
  return serializeJob(job);
};

type ListMyJobsInput = {
  userId: string;
  status?: string;
  cursor?: string;
  limit?: number;
};

type ReOverlayInput = {
  jobId: string;
  userId: string;
  headline: string;
  subhead?: string;
  cta?: string;
};

/**
 * 텍스트 재편집 — GPT 재호출 없이 PIL만 다시 호출.
 * 흰디 패턴의 핵심 가치 (자연스러운 텍스트 편집).
 */
export const reOverlayText = async (input: ReOverlayInput) => {
  const job = await jobRepository.findById(input.jobId);
  if (!job) throw adErrors.jobNotFound();
  if (job.userId !== input.userId) throw adErrors.jobForbidden();
  if (!job.baseImageUrl) {
    throw adErrors.validationError("재편집할 베이스 이미지가 없습니다 (재생성 필요)");
  }

  // 기존 textOverlays에서 색·메타데이터 추출 — PIL과 새 textOverlays가 같은 색을 쓰도록 단일 출처.
  const prevHeadline = findOverlay(job.textOverlays, "headline");
  const prevSubhead = findOverlay(job.textOverlays, "subhead");
  const prevCta = findOverlay(job.textOverlays, "cta");

  const headlineColor = prevHeadline?.color ?? "#FFFFFF";
  const subheadColor = prevSubhead?.color ?? headlineColor;

  // baseImageUrl은 fal.storage 외부 URL로 저장되므로 그대로 PIL에 전달.
  const overlayResult = await overlayKoreanText({
    baseUrl: job.baseImageUrl,
    headline: input.headline,
    subhead: composePilSubhead(input.subhead, input.cta),
    headlineColor,
    subheadColor,
    // logo 생략 — 최초 생성과 동일하게 브랜드 워터마크 미삽입.
    template: "instagram_square",
  });

  // 매 재편집마다 새 파일명으로 저장 — 같은 URL이면 브라우저 cache로 옛 이미지 보임 방지
  const resultRel = path.join(
    "ads",
    job.userId,
    `${job.id}-${Date.now()}.png`,
  );
  const resultUrl = await saveBuffer(resultRel, overlayResult.buffer);

  // 새 textOverlays 빌드 — 기존 메타데이터(색·좌표·폰트크기 등) 그대로 보존, content만 갱신.
  // 이전에 없던 항목이 새로 들어오면 DEFAULT_OVERLAY_LAYOUT + headline 색으로 폴백.
  const newOverlays: StoredOverlay[] = [];
  const buildOverlay = (
    prev: StoredOverlay | null,
    id: "headline" | "subhead" | "cta",
    content: string,
  ): StoredOverlay | null => {
    if (!content) return null;
    if (prev) return { ...prev, content };
    const layout = DEFAULT_OVERLAY_LAYOUT[id];
    const fontSize = id === "headline" ? 56 : id === "cta" ? 28 : 24;
    const fontWeight: "normal" | "bold" = id === "subhead" ? "normal" : "bold";
    return {
      id,
      content,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      fontSize,
      fontWeight,
      color: id === "subhead" ? subheadColor : headlineColor,
      textAlign: layout.textAlign,
    };
  };

  const headlineOverlay = buildOverlay(prevHeadline, "headline", input.headline);
  if (headlineOverlay) newOverlays.push(headlineOverlay);
  const subheadOverlay = buildOverlay(prevSubhead, "subhead", input.subhead ?? "");
  if (subheadOverlay) newOverlays.push(subheadOverlay);
  const ctaOverlay = buildOverlay(prevCta, "cta", input.cta ?? "");
  if (ctaOverlay) newOverlays.push(ctaOverlay);

  const updated = await jobRepository.updateJob(job.id, {
    resultUrl,
    headline: input.headline,
    subhead: input.subhead ?? null,
    cta: input.cta ?? null,
    textOverlays: newOverlays as unknown as Prisma.InputJsonValue,
  });

  return serializeJob(updated);
};

export const listMyJobs = async (input: ListMyJobsInput) => {
  const limit = Math.min(input.limit ?? 20, 100);
  const items = await jobRepository.listByUser(input.userId, {
    status: input.status,
    cursor: input.cursor,
    limit,
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id ?? null : null;

  return {
    items: trimmed.map(serializeJobListItem),
    nextCursor,
  };
};

type DeleteJobInput = { jobId: string; userId: string };

export const deleteJob = async ({ jobId, userId }: DeleteJobInput) => {
  const job = await jobRepository.findByIdAndUser(jobId, userId);
  if (!job) throw adErrors.jobNotFound();

  if (job.status === "queued" || job.status === "processing") {
    throw adErrors.jobBusy();
  }

  await tryUnlinkPublicUrl(job.resultUrl);
  await tryUnlinkPublicUrl(job.originalResultUrl);
  await tryUnlinkPublicUrl(job.baseImageUrl);
  await tryUnlinkPublicUrl(job.productImagePath);

  if (Array.isArray(job.intermediateUrls)) {
    for (const entry of job.intermediateUrls as Prisma.JsonArray) {
      if (typeof entry === "string") {
        await tryUnlinkPublicUrl(entry);
      } else if (entry && typeof entry === "object" && "url" in entry) {
        const url = (entry as { url?: unknown }).url;
        if (typeof url === "string") await tryUnlinkPublicUrl(url);
      }
    }
  }

  await jobRepository.deleteById(job.id);
  return { id: job.id };
};

type DownloadJobInput = { jobId: string; userId: string };

const sanitizeFilenameSegment = (s: string): string =>
  s.replace(/[\\/]/g, "").trim();

export const getDownloadInfo = async ({ jobId, userId }: DownloadJobInput) => {
  const job = await jobRepository.findByIdAndUser(jobId, userId);
  if (!job) throw adErrors.jobNotFound();

  if (job.status !== "completed" || !job.resultUrl) {
    throw adErrors.jobNotDownloadable();
  }

  const rel = publicUrlToRelative(job.resultUrl);
  if (!rel) throw adErrors.jobNotDownloadable();

  const absolutePath = getAbsolutePath(rel);
  const ext = path.extname(rel) || ".png";
  const dateStr = job.createdAt.toISOString().slice(0, 10);
  const modelSegment = job.catalogModel?.name
    ? `-${sanitizeFilenameSegment(job.catalogModel.name)}`
    : "";
  const filename = `muse${modelSegment}-${dateStr}${ext}`;

  return { absolutePath, filename };
};
