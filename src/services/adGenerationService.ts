import path from "node:path";
import * as jobRepository from "../repositories/jobRepository";
import * as catalogModelRepository from "../repositories/catalogModelRepository";
import { generateScene, faceSwapWithUpload, uploadToFalStorage } from "../lib/fal";
import fs from "node:fs/promises";
import { composeAdImage, recommendAdCopy, adCopyToOverlays } from "../lib/openai";
import type { AdCopyResult } from "../lib/openai";
import { overlayKoreanText } from "../lib/pilClient";
import { buildAdImagePrompt } from "../lib/promptBuilder";
import { TEXT_FREE_RULES } from "../lib/promptTemplates";
import {
  saveBuffer,
  downloadToFile,
  getAbsolutePath,
  getPublicUrl,
} from "../lib/localStorage";
import { startAdGenerationWorker } from "../lib/queue";
import type { AdGenerationJobData } from "../lib/queue";
import type { Job as BullJob } from "bullmq";

const COST_FLUX_CENTS = 4;
const COST_GPT_IMAGE_CENTS = 21;
const COST_FACE_SWAP_CENTS = 5;

// PIL 서비스가 cta 인자를 지원하는지 (옵션 A 정식 마이그 시 true).
// 현재 PIL은 headline/subhead만 받으므로 BE에서 subhead+cta `\n` 합쳐 보내는 fallback (옵션 B).
const PIL_HAS_CTA = process.env.PIL_HAS_CTA === "true";

const buildScenePrompt = (params: {
  industry?: string | null;
  item?: string | null;
  extraDescription?: string | null;
  mood?: string | null;
  prompt: string;
  modelGender?: "F" | "M";
}): string => {
  // 학술 zone 룰 + 업종별 디자인 코드 자동 적용. industry 없으면 "기타" fallback.
  return buildAdImagePrompt({
    industry: params.industry ?? "기타",
    product: params.item ?? params.prompt,
    modelGender: params.modelGender,
  });
};

const buildComposePrompt = (params: {
  item?: string | null;
}): string => {
  const lines: string[] = [
    "첫 번째 이미지의 인물을 그대로 유지하면서 광고 사진을 만들어줘.",
  ];
  if (params.item) {
    lines.push(
      `두 번째 이미지의 제품(${params.item})을 인물이 자연스럽게 들고 있거나 옆에 배치해줘. 제품의 형태와 색상은 유지.`,
    );
  }
  lines.push(
    "원본 인물의 얼굴/체형/의상 톤은 유지. 사진에는 사람과 제품, 배경만 있도록.",
  );
  lines.push("");
  lines.push(TEXT_FREE_RULES);
  return lines.join("\n");
};

const composePilSubhead = (
  subhead: string | null | undefined,
  cta: string | null | undefined,
): string | undefined => {
  if (PIL_HAS_CTA) return subhead ?? undefined;
  // PIL이 cta 미지원 → subhead와 cta를 줄바꿈으로 합쳐 보냄 (zone 분리는 안 됨)
  const parts = [subhead, cta].filter((s): s is string => Boolean(s && s.length > 0));
  return parts.length > 0 ? parts.join("\n") : undefined;
};

const isContentPolicyError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; status?: number; type?: string };
  return (
    e.code === "content_policy_violation" ||
    e.type === "image_generation_user_error"
  );
};

const isRateLimitError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; status?: number };
  return e.status === 429 || e.code === "rate_limit_exceeded";
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const processAdGenerationJob = async (
  bullJob: BullJob<AdGenerationJobData>,
): Promise<void> => {
  const { jobId } = bullJob.data;
  const job = await jobRepository.findById(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  if (!job.catalogModelId) throw new Error("catalogModelId required");

  const catalog = await catalogModelRepository.findById(job.catalogModelId);
  if (!catalog) throw new Error("catalog model missing");

  await jobRepository.updateJob(jobId, {
    status: "processing",
    progress: 5,
    startedAt: new Date(),
    errorMessage: null,
  });

  const intermediate: Record<string, string> = {};
  let totalCostCents = 0;
  let seedValue: bigint | null = null;
  let lastFalRequestId: string | null = null;

  try {
    // 1. fal.ai FLUX-LoRA scene generation
    await jobRepository.updateJob(jobId, { progress: 15 });
    const scenePrompt = buildScenePrompt({
      industry: job.industry,
      item: job.item,
      extraDescription: job.extraDescription,
      mood: job.mood,
      prompt: job.prompt,
      modelGender: catalog.gender === "male" ? "M" : "F",
    });
    const scene = await generateScene({
      prompt: scenePrompt,
      imageSize: "portrait_4_3",
    });
    seedValue = scene.seed;
    lastFalRequestId = scene.requestId;
    totalCostCents += COST_FLUX_CENTS;

    const sceneRel = path.join(
      "intermediate",
      job.userId,
      job.id,
      "scene.png",
    );
    intermediate.scene = await downloadToFile(scene.imageUrl, sceneRel);

    // 2. GPT-image-1 product composition (제품 이미지 첨부된 경우만)
    let composedAbsPath: string;
    if (job.productImagePath) {
      await jobRepository.updateJob(jobId, {
        progress: 40,
        intermediateUrls: intermediate,
      });
      const composedPrompt = buildComposePrompt({
        item: job.item,
      });
      const personPath = getAbsolutePath(
        sceneRel.split(path.sep).join("/"),
      );
      const productAbsPath = job.productImagePath.startsWith("/uploads/")
        ? getAbsolutePath(job.productImagePath.replace(/^\/uploads\//, ""))
        : job.productImagePath;

      const composed = await composeAdImage({
        personImagePath: personPath,
        productImagePath: productAbsPath,
        prompt: composedPrompt,
        size: "1024x1536",
        quality: "high",
      });
      const composedRel = path.join(
        "intermediate",
        job.userId,
        job.id,
        "composed.png",
      );
      intermediate.composed = await saveBuffer(composedRel, composed.buffer);
      composedAbsPath = getAbsolutePath(
        composedRel.split(path.sep).join("/"),
      );
      totalCostCents += COST_GPT_IMAGE_CENTS;
    } else {
      composedAbsPath = getAbsolutePath(sceneRel.split(path.sep).join("/"));
    }

    // 3. fal.ai face-swap with catalog model face (via fal.storage.upload)
    await jobRepository.updateJob(jobId, {
      progress: 65,
      intermediateUrls: intermediate,
    });

    // composed 이미지 buffer + 카탈로그 face buffer를 fal.storage에 업로드 → swap
    let swappedUrl: string | null = null;
    try {
      const composedBuffer = await fs.readFile(composedAbsPath);
      const catalogFaceRel = catalog.faceImageUrl.replace(/^\/uploads\//, "");
      const catalogFaceBuffer = await fs.readFile(getAbsolutePath(catalogFaceRel));

      const swapped = await faceSwapWithUpload({
        composedBuffer,
        catalogFaceBuffer,
        jobId: job.id,
      });
      swappedUrl = swapped.imageUrl;
      lastFalRequestId = swapped.requestId;
      totalCostCents += COST_FACE_SWAP_CENTS;
      const swappedRel = path.join(
        "intermediate",
        job.userId,
        job.id,
        "swapped.png",
      );
      intermediate.swapped = await downloadToFile(swappedUrl, swappedRel);
    } catch (err) {
      console.warn(
        `[ad-worker] face-swap failed for job ${jobId}, using composed result:`,
        err instanceof Error ? err.message : err,
      );
      // face-swap 실패해도 composed 결과는 있으므로 폴백으로 진행
    }

    // 3.5. 텍스트 없는 베이스 이미지 별도 보존 (re-overlay endpoint용)
    // 마지막 단계 이미지(swapped > composed > scene)를 base.png로 로컬 저장 + fal.storage 업로드.
    // PIL은 외부 URL fetch만 가능하므로 fal.storage URL을 DB에 저장.
    const baseSourceRel = (
      intermediate.swapped ??
      intermediate.composed ??
      intermediate.scene
    ).replace(/^\/uploads\//, "");
    const baseRel = path.join("intermediate", job.userId, job.id, "base.png");
    const baseBuffer = await fs.readFile(getAbsolutePath(baseSourceRel));
    await saveBuffer(baseRel, baseBuffer);
    const baseImageUrl = await uploadToFalStorage(
      baseBuffer,
      `base-${job.id}.png`,
    );

    // 4. 광고 카피 메타데이터 생성 (편집 가능 텍스트 레이어용)
    // PIL overlay 직전에 카피 생성 — 카피의 cta까지 같이 보낼 수 있도록.
    let adCopy: AdCopyResult = { headline: "", subhead: "", cta: "", tone: "warm" };
    try {
      adCopy = await recommendAdCopy({
        industry: job.industry ?? "",
        item: job.item ?? "",
        mood: job.mood ?? undefined,
        extraDescription: job.extraDescription ?? undefined,
      });
    } catch (err) {
      console.warn(
        `[ad-worker] recommendAdCopy failed for job ${jobId}:`,
        err instanceof Error ? err.message : err,
      );
    }

    // 사용자 입력 우선, 없으면 AI 추천 카피 사용
    const finalHeadline = job.headline ?? (adCopy.headline || null);
    const finalSubhead = job.subhead ?? (adCopy.subhead || null);
    const finalCta = adCopy.cta || null;

    // 4. PIL overlay (한글 카피)
    await jobRepository.updateJob(jobId, {
      progress: 85,
      intermediateUrls: intermediate,
    });

    // PIL은 외부 URL fetch만 가능. swappedUrl(fal.media) 우선, 없으면 baseImageUrl(fal.storage) fallback.
    const pilBaseUrl = swappedUrl ?? baseImageUrl;
    let finalBuffer: Buffer;
    if (finalHeadline && pilBaseUrl) {
      try {
        const overlayResult = await overlayKoreanText({
          baseUrl: pilBaseUrl,
          headline: finalHeadline,
          subhead: composePilSubhead(finalSubhead, finalCta),
          logo: "MUSE",
          template: "instagram_square",
        });
        finalBuffer = overlayResult.buffer;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`PIL overlay failed: ${detail}`);
      }
    } else {
      // 폴백: 카피 없이 베이스 이미지 그대로 사용
      finalBuffer = baseBuffer;
    }

    const resultRel = path.join("ads", job.userId, `${job.id}.png`);
    const resultUrl = await saveBuffer(resultRel, finalBuffer);

    const textOverlays = adCopyToOverlays({
      headline: finalHeadline ?? "",
      subhead: finalSubhead ?? "",
      cta: finalCta ?? "",
      tone: adCopy.tone,
    });

    await jobRepository.updateJob(jobId, {
      status: "completed",
      progress: 100,
      resultUrl,
      originalResultUrl: resultUrl, // 첫 결과를 별도 컬럼에 보존 — 재편집 시에도 좌측 카드는 이 URL 사용
      baseImageUrl,
      cta: finalCta,
      intermediateUrls: intermediate,
      textOverlays: textOverlays as unknown as import("@prisma/client").Prisma.InputJsonValue,
      costCents: totalCostCents,
      seed: seedValue,
      falRequestId: lastFalRequestId,
      completedAt: new Date(),
      errorMessage: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (isContentPolicyError(err)) {
      await jobRepository.updateJob(jobId, {
        status: "failed",
        errorMessage: "프롬프트가 정책에 의해 차단되었습니다",
        completedAt: new Date(),
        intermediateUrls: intermediate,
        costCents: totalCostCents,
      });
      return;
    }

    if (isRateLimitError(err)) {
      await sleep(5000);
      throw err;
    }

    await jobRepository.updateJob(jobId, {
      status: "failed",
      errorMessage: message,
      completedAt: new Date(),
      intermediateUrls: intermediate,
      costCents: totalCostCents,
    });
    throw err;
  }
};

export const startWorker = () => startAdGenerationWorker(processAdGenerationJob);
