import { fal } from "@fal-ai/client";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY env is required");
  }
  fal.config({ credentials: process.env.FAL_KEY });
  configured = true;
}

type GenerateSceneInput = {
  prompt: string;
  imageSize?: "square_hd" | "square" | "landscape_16_9" | "landscape_4_3" | "portrait_16_9" | "portrait_4_3";
  numInferenceSteps?: number;
  guidanceScale?: number;
  extraLoras?: { path: string; scale: number }[];
};

type GenerateSceneResult = {
  imageUrl: string;
  width: number;
  height: number;
  seed: bigint | null;
  requestId: string;
};

export async function generateScene(
  input: GenerateSceneInput,
): Promise<GenerateSceneResult> {
  ensureConfigured();

  // Muse v3 매거진 톤 LoRA 스택.
  // - MUSE_LORA_URL: v3 (학습 시 EMA·5000step·rank 32 조합으로 텍스처 평균화 → plasticky 잔재.
  //   재학습은 별도 자산이라 유지하고, 추론 시 Realism booster + 자연 톤 트리거 prompt로 잔재 억제.)
  // - REALISM_LORA_URL: 자연 피부 (1.0으로 booster — Muse 평균화 압도)
  // - KODA_LORA_URL: 사진/필름 톤 (0.4로 보조 — 결·필름 그레인 강화)
  // 참고: fal-ai/flux-lora는 negative_prompt를 받지 않음 (FLUX는 native CFG 없음).
  // plasticky 억제는 promptTemplates.QUALITY_RULES의 자연 톤 트리거(positive)로만 수행.
  const loras: { path: string; scale: number }[] = [];
  if (process.env.MUSE_LORA_URL) {
    loras.push({ path: process.env.MUSE_LORA_URL, scale: 0.7 });
  }
  if (process.env.REALISM_LORA_URL) {
    loras.push({ path: process.env.REALISM_LORA_URL, scale: 1.0 });
  }
  if (process.env.KODA_LORA_URL) {
    loras.push({ path: process.env.KODA_LORA_URL, scale: 0.4 });
  }
  if (input.extraLoras) {
    loras.push(...input.extraLoras);
  }

  const result = await fal.subscribe("fal-ai/flux-lora", {
    input: {
      prompt: input.prompt,
      loras,
      image_size: input.imageSize ?? "portrait_4_3",
      num_inference_steps: input.numInferenceSteps ?? 30,
      // FLUX-dev sweet spot 3.0~3.5. 3.5는 LoRA 스택과 결합 시 over-saturation·plasticky 가속.
      guidance_scale: input.guidanceScale ?? 3.0,
      num_images: 1,
      enable_safety_checker: false,
    },
  });

  const image = result.data.images[0];
  if (!image) throw new Error("fal.ai returned no image");
  // fal.ai의 seed가 종종 int64 범위를 초과하는 큰 정수라 bigint 캐스팅 시 PG에서 거부됨.
  // 안전 범위 안일 때만 저장, 아니면 null.
  const PG_BIGINT_MAX = 9223372036854775807n;
  const rawSeed = result.data.seed;
  let seed: bigint | null = null;
  if (rawSeed != null) {
    try {
      const candidate = BigInt(rawSeed);
      if (candidate >= -PG_BIGINT_MAX && candidate <= PG_BIGINT_MAX) {
        seed = candidate;
      }
    } catch {
      // ignore parse errors
    }
  }
  return {
    imageUrl: image.url,
    width: image.width ?? 0,
    height: image.height ?? 0,
    seed,
    requestId: result.requestId,
  };
}

type FaceSwapInput = {
  baseImageUrl: string;
  swapImageUrl: string;
};

type FaceSwapResult = {
  imageUrl: string;
  requestId: string;
};

type FaceSwapResponseData = {
  image?: { url: string };
};

export async function faceSwap(input: FaceSwapInput): Promise<FaceSwapResult> {
  ensureConfigured();

  // 단언 사유: fal.subscribe의 generic 타입은 호출처에 따라 달라지나 face-swap 모델의 응답 형태는 docs로 고정되어 있음
  const result = (await fal.subscribe("fal-ai/face-swap", {
    input: {
      base_image_url: input.baseImageUrl,
      swap_image_url: input.swapImageUrl,
    },
  })) as { data: FaceSwapResponseData; requestId: string };

  const image = result.data.image;
  if (!image) throw new Error("face-swap returned no image");
  return {
    imageUrl: image.url,
    requestId: result.requestId,
  };
}

// fal.storage에 buffer 업로드 → 외부 fetch 가능한 영구 URL 반환
// fal.ai 서버가 우리 로컬 BE 이미지를 못 가져오는 문제를 우회. (FAL_KEY로 인증, GCP/S3 등 별도 스토리지 불필요)
export async function uploadToFalStorage(
  buffer: Buffer,
  filename: string,
  mimeType = "image/png",
): Promise<string> {
  ensureConfigured();
  // fal.storage.upload는 Blob/File을 받음 (Node 18+ 글로벌 Blob).
  // Node Buffer를 Uint8Array(ArrayBuffer 기반)로 복사해 BlobPart 타입 호환.
  const u8 = new Uint8Array(buffer.byteLength);
  u8.set(buffer);
  const blob = new Blob([u8], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });
  return fal.storage.upload(file);
}

// 합성 이미지(buffer) + 카탈로그 face(파일 경로) → fal.storage 업로드 → face-swap 호출
export async function faceSwapWithUpload(input: {
  composedBuffer: Buffer;
  catalogFaceBuffer: Buffer;
  jobId: string;
}): Promise<FaceSwapResult> {
  ensureConfigured();
  const [baseUrl, swapUrl] = await Promise.all([
    uploadToFalStorage(input.composedBuffer, `composed-${input.jobId}.png`),
    uploadToFalStorage(input.catalogFaceBuffer, `catalog-face-${input.jobId}.png`),
  ]);
  return faceSwap({ baseImageUrl: baseUrl, swapImageUrl: swapUrl });
}
