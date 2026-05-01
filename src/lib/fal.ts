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

  const loras: { path: string; scale: number }[] = [];
  if (process.env.REALISM_LORA_URL) {
    loras.push({ path: process.env.REALISM_LORA_URL, scale: 0.8 });
  }
  if (process.env.KODA_LORA_URL) {
    loras.push({ path: process.env.KODA_LORA_URL, scale: 0.3 });
  }
  if (input.extraLoras) {
    loras.push(...input.extraLoras);
  }

  const result = await fal.subscribe("fal-ai/flux-lora", {
    input: {
      prompt: input.prompt,
      loras,
      image_size: input.imageSize ?? "square_hd",
      num_inference_steps: input.numInferenceSteps ?? 30,
      guidance_scale: input.guidanceScale ?? 3.5,
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
