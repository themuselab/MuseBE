import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import "dotenv/config";

type ImpressionLabel =
  | "trust"
  | "friendly"
  | "intimate"
  | "sophisticated"
  | "lively"
  | "comfortable";

type MockSpec = {
  slug: string;
  name: string;
  gender: "female" | "male";
  age: "20s" | "30s" | "40s" | "50s" | "60s_plus";
  primaryLabel: ImpressionLabel;
  prompt: string;
};

const MOCKS: MockSpec[] = [
  {
    slug: "mock-1",
    name: "지유",
    gender: "female",
    age: "20s",
    primaryLabel: "sophisticated",
    prompt:
      "beautiful Korean woman in her 20s, sophisticated editorial style, neutral studio background, front-facing portrait, sharp details, professional lighting",
  },
  {
    slug: "mock-2",
    name: "민준",
    gender: "male",
    age: "30s",
    primaryLabel: "trust",
    prompt:
      "Korean man in his 30s, trustworthy clean look, neutral studio background, front-facing portrait, sharp details, professional lighting",
  },
  {
    slug: "mock-3",
    name: "서연",
    gender: "female",
    age: "30s",
    primaryLabel: "friendly",
    prompt:
      "friendly Korean woman in her 30s, warm smile, neutral studio background, front-facing portrait, sharp details, professional lighting",
  },
];

const OUTPUT_DIR = path.resolve(__dirname, "../uploads/catalog");

// primaryLabel별 5축 점수 프리셋 (0~100)
type Scores = {
  trust: number;
  sophisticated: number;
  friendly: number;
  stable: number;
  cheerful: number;
};

const SCORE_PRESETS: Record<ImpressionLabel, Scores> = {
  trust: { trust: 90, sophisticated: 70, friendly: 65, stable: 80, cheerful: 50 },
  sophisticated: { trust: 70, sophisticated: 88, friendly: 55, stable: 65, cheerful: 50 },
  friendly: { trust: 70, sophisticated: 55, friendly: 90, stable: 60, cheerful: 80 },
  intimate: { trust: 65, sophisticated: 50, friendly: 85, stable: 60, cheerful: 70 },
  lively: { trust: 60, sophisticated: 55, friendly: 75, stable: 50, cheerful: 92 },
  comfortable: { trust: 75, sophisticated: 50, friendly: 75, stable: 88, cheerful: 60 },
};

const TAG_PRESETS: Record<ImpressionLabel, string[]> = {
  trust: ["신뢰감", "안정감"],
  sophisticated: ["세련됨", "신뢰감"],
  friendly: ["친근감", "유쾌함"],
  intimate: ["친한형", "친근감"],
  lively: ["활달함", "유쾌함"],
  comfortable: ["편안함", "안정감"],
};

const RECOMMENDED_INDUSTRIES_PRESETS: Record<ImpressionLabel, string[]> = {
  trust: ["finance", "education", "healthcare"],
  sophisticated: ["fashion", "beauty", "luxury"],
  friendly: ["food_beverage", "cafe", "lifestyle"],
  intimate: ["lifestyle", "cafe", "wellness"],
  lively: ["sports", "entertainment", "youth_brand"],
  comfortable: ["home_living", "wellness", "family"],
};

function downloadToFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = require("node:fs").createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`download failed: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", reject);
  });
}

async function main() {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is not set in .env");
  }
  fal.config({ credentials: process.env.FAL_KEY });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const spec of MOCKS) {
    const filePath = path.join(OUTPUT_DIR, `${spec.slug}.png`);
    try {
      await fs.access(filePath);
      console.log(`[skip] ${spec.slug} already exists`);
      continue;
    } catch {
      // not exists, proceed
    }

    console.log(`[generate] ${spec.slug} (${spec.name})`);
    const loras: { path: string; scale: number }[] = [];
    if (process.env.REALISM_LORA_URL) {
      loras.push({ path: process.env.REALISM_LORA_URL, scale: 0.8 });
    }
    if (process.env.MUSE_LORA_URL && process.env.MUSE_LORA_USABLE === "true") {
      loras.push({ path: process.env.MUSE_LORA_URL, scale: 0.6 });
    }

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: spec.prompt,
        loras,
        image_size: "square_hd",
        num_inference_steps: 30,
        guidance_scale: 3.5,
      },
    });
    const url = result.data.images[0].url;
    await downloadToFile(url, filePath);
    console.log(`[saved] ${filePath}`);
  }

  // imageUrls는 우선 face 1장을 6번 미러. 추후 다른 사진 들어오면 갱신.
  const meta = MOCKS.map((spec) => {
    const faceImageUrl = `/uploads/catalog/${spec.slug}.png`;
    return {
      ...spec,
      faceImageUrl,
      imageUrls: Array.from({ length: 6 }, () => faceImageUrl),
      scores: SCORE_PRESETS[spec.primaryLabel],
      tags: TAG_PRESETS[spec.primaryLabel],
      recommendedIndustries: RECOMMENDED_INDUSTRIES_PRESETS[spec.primaryLabel],
    };
  });
  await fs.writeFile(
    path.join(OUTPUT_DIR, "mock-meta.json"),
    JSON.stringify(meta, null, 2),
  );
  console.log("[done] meta written to uploads/catalog/mock-meta.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
