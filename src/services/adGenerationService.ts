import path from "node:path";
import * as jobRepository from "../repositories/jobRepository";
import * as catalogModelRepository from "../repositories/catalogModelRepository";
import { generateScene, faceSwap } from "../lib/fal";
import { composeAdImage } from "../lib/openai";
import { overlayKoreanText } from "../lib/pilClient";
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
const COST_GPT_IMAGE_CENTS = 17;
const COST_FACE_SWAP_CENTS = 5;

const buildScenePrompt = (params: {
  industry?: string | null;
  item?: string | null;
  extraDescription?: string | null;
  mood?: string | null;
  prompt: string;
}): string => {
  const parts: string[] = [
    "professional Korean person, editorial fashion photography, studio lighting, sharp details",
  ];
  if (params.mood) parts.push(params.mood);
  if (params.industry) parts.push(`industry: ${params.industry}`);
  if (params.item) parts.push(`product context: ${params.item}`);
  if (params.extraDescription) parts.push(params.extraDescription);
  parts.push(params.prompt);
  parts.push("clean composition with empty space for text overlay");
  return parts.join(", ");
};

const buildComposePrompt = (params: {
  headline?: string | null;
  subhead?: string | null;
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
    "원본 인물의 얼굴/체형/의상 톤은 유지. 한글 카피는 빈 영역으로 남겨둘 것.",
  );
  if (params.headline) {
    lines.push(`(참고: 헤드라인은 "${params.headline}"로 사용 예정)`);
  }
  return lines.join("\n");
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
    });
    const scene = await generateScene({
      prompt: scenePrompt,
      imageSize: "square_hd",
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
        headline: job.headline,
        subhead: job.subhead,
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
        size: "1024x1024",
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

    // 3. fal.ai face-swap with catalog model face
    await jobRepository.updateJob(jobId, {
      progress: 65,
      intermediateUrls: intermediate,
    });
    const composedPublicUrl = process.env.PUBLIC_BASE_URL
      ? `${process.env.PUBLIC_BASE_URL}${getPublicUrl(
          path.relative(getAbsolutePath(""), composedAbsPath),
        )}`
      : null;
    const catalogPublicUrl = process.env.PUBLIC_BASE_URL
      ? `${process.env.PUBLIC_BASE_URL}${catalog.faceImageUrl}`
      : null;

    let swappedUrl: string | null = null;
    if (composedPublicUrl && catalogPublicUrl) {
      const swapped = await faceSwap({
        baseImageUrl: composedPublicUrl,
        swapImageUrl: catalogPublicUrl,
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
    } else {
      // PUBLIC_BASE_URL 미설정 (로컬 테스트) — face-swap 스킵하고 composed 결과 그대로 사용
      console.warn(
        `[ad-worker] PUBLIC_BASE_URL not set, skipping face-swap for job ${jobId}`,
      );
    }

    // 4. PIL overlay (한글 카피)
    await jobRepository.updateJob(jobId, {
      progress: 85,
      intermediateUrls: intermediate,
    });

    let finalBuffer: Buffer;
    if (
      job.headline &&
      swappedUrl &&
      process.env.PUBLIC_BASE_URL
    ) {
      try {
        const overlayResult = await overlayKoreanText({
          baseUrl: swappedUrl,
          headline: job.headline,
          subhead: job.subhead ?? undefined,
          logo: "MUSE",
          template: "instagram_square",
        });
        finalBuffer = overlayResult.buffer;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`PIL overlay failed: ${detail}`);
      }
    } else {
      // 폴백: 카피 없이 마지막 단계 이미지 그대로 사용
      const fallbackRel = (intermediate.swapped ?? intermediate.composed ?? intermediate.scene).replace(
        /^\/uploads\//,
        "",
      );
      finalBuffer = require("node:fs").readFileSync(
        getAbsolutePath(fallbackRel),
      );
    }

    const resultRel = path.join("ads", job.userId, `${job.id}.png`);
    const resultUrl = await saveBuffer(resultRel, finalBuffer);

    await jobRepository.updateJob(jobId, {
      status: "completed",
      progress: 100,
      resultUrl,
      intermediateUrls: intermediate,
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
