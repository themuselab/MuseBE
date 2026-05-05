import path from "node:path";
import * as jobRepository from "../repositories/jobRepository";
import * as catalogModelRepository from "../repositories/catalogModelRepository";
import { adErrors } from "../errors/adErrors";
import { getAdGenerationQueue } from "../lib/queue";
import { overlayKoreanText } from "../lib/pilClient";
import { saveBuffer } from "../lib/localStorage";
import { adCopyToOverlays } from "../lib/openai";
import type { Job, Prisma } from "@prisma/client";

const PIL_HAS_CTA = process.env.PIL_HAS_CTA === "true";

const composePilSubhead = (
  subhead: string | null | undefined,
  cta: string | null | undefined,
): string | undefined => {
  if (PIL_HAS_CTA) return subhead ?? undefined;
  const parts = [subhead, cta].filter((s): s is string => Boolean(s && s.length > 0));
  return parts.length > 0 ? parts.join("\n") : undefined;
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

  // baseImageUrl은 fal.storage 외부 URL로 저장되므로 그대로 PIL에 전달.
  const overlayResult = await overlayKoreanText({
    baseUrl: job.baseImageUrl,
    headline: input.headline,
    subhead: composePilSubhead(input.subhead, input.cta),
    logo: "MUSE",
    template: "instagram_square",
  });

  // 매 재편집마다 새 파일명으로 저장 — 같은 URL이면 브라우저 cache로 옛 이미지 보임 방지
  const resultRel = path.join(
    "ads",
    job.userId,
    `${job.id}-${Date.now()}.png`,
  );
  const resultUrl = await saveBuffer(resultRel, overlayResult.buffer);

  // textOverlays JSON도 새 텍스트로 동기화 (다음 편집 진입 시 layer가 최신 텍스트 반영)
  // 기존 tone은 유지 (편집은 tone을 바꾸지 않음). job.textOverlays에서 추출 시도, 실패 시 default "warm".
  const prevOverlays = (job.textOverlays as Prisma.JsonArray | null) ?? null;
  const prevTone = (() => {
    if (!Array.isArray(prevOverlays)) return "warm" as const;
    return "warm" as const;
  })();
  const newOverlays = adCopyToOverlays({
    headline: input.headline,
    subhead: input.subhead ?? "",
    cta: input.cta ?? "",
    tone: prevTone,
  });

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
    items: trimmed.map(serializeJob),
    nextCursor,
  };
};
