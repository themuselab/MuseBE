import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import "dotenv/config";

type ImpressionLabel =
  | "trust"
  | "sophisticated"
  | "friendly"
  | "comfortable"
  | "professional"
  | "lively";

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

// primaryLabel별 6축 점수 프리셋 (0~100)
// 6축: trust(신뢰감), sophisticated(세련됨), friendly(친근함), comfortable(편안함), professional(전문성), lively(활발함)
type Scores = {
  trust: number;
  sophisticated: number;
  friendly: number;
  comfortable: number;
  professional: number;
  lively: number;
};

const SCORE_PRESETS: Record<ImpressionLabel, Scores> = {
  trust:         { trust: 92, sophisticated: 70, friendly: 65, comfortable: 75, professional: 80, lively: 50 },
  sophisticated: { trust: 70, sophisticated: 92, friendly: 55, comfortable: 60, professional: 78, lively: 55 },
  friendly:      { trust: 75, sophisticated: 55, friendly: 92, comfortable: 78, professional: 60, lively: 78 },
  comfortable:   { trust: 80, sophisticated: 55, friendly: 78, comfortable: 92, professional: 65, lively: 60 },
  professional:  { trust: 80, sophisticated: 75, friendly: 55, comfortable: 60, professional: 92, lively: 55 },
  lively:        { trust: 60, sophisticated: 60, friendly: 78, comfortable: 60, professional: 55, lively: 92 },
};

const TAG_PRESETS: Record<ImpressionLabel, string[]> = {
  trust: ["신뢰감", "전문성"],
  sophisticated: ["세련됨", "전문성"],
  friendly: ["친근함", "활발함"],
  comfortable: ["편안함", "친근함"],
  professional: ["전문성", "신뢰감"],
  lively: ["활발함", "친근함"],
};

const RECOMMENDED_INDUSTRIES_PRESETS: Record<ImpressionLabel, string[]> = {
  trust: ["finance_insurance", "law_security_defense", "health_medical"],
  sophisticated: ["fashion_beauty", "culture_art_design", "hospitality_leisure"],
  friendly: ["food_service", "education_science", "social_welfare_religion"],
  comfortable: ["health_medical", "social_welfare_religion", "food_service"],
  professional: ["management_accounting", "law_security_defense", "information_communication"],
  lively: ["hospitality_leisure", "culture_art_design", "sales"],
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
