import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import "dotenv/config";

type MockSpec = {
  slug: string;
  name: string;
  gender: "female" | "male";
  age: "20" | "30" | "40" | "50" | "60+";
  primaryLabel: string;
  prompt: string;
};

const MOCKS: MockSpec[] = [
  {
    slug: "mock-1",
    name: "지유",
    gender: "female",
    age: "20",
    primaryLabel: "sophisticated",
    prompt:
      "beautiful Korean woman in her 20s, sophisticated editorial style, neutral studio background, front-facing portrait, sharp details, professional lighting",
  },
  {
    slug: "mock-2",
    name: "민준",
    gender: "male",
    age: "30",
    primaryLabel: "trust",
    prompt:
      "Korean man in his 30s, trustworthy clean look, neutral studio background, front-facing portrait, sharp details, professional lighting",
  },
  {
    slug: "mock-3",
    name: "서연",
    gender: "female",
    age: "30",
    primaryLabel: "friendly",
    prompt:
      "friendly Korean woman in her 30s, warm smile, neutral studio background, front-facing portrait, sharp details, professional lighting",
  },
];

const OUTPUT_DIR = path.resolve(__dirname, "../uploads/catalog");

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

  const meta = MOCKS.map((spec) => ({
    ...spec,
    faceImageUrl: `/uploads/catalog/${spec.slug}.png`,
  }));
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
