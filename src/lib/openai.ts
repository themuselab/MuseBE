import OpenAI, { toFile } from "openai";
import fs from "node:fs";
import path from "node:path";

let cached: OpenAI | null = null;

function getClient(): OpenAI {
  if (cached) return cached;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY env is required");
  }
  cached = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return cached;
}

type RecommendMoodsInput = {
  industry: string;
  item: string;
  extraDescription?: string;
};

const MOOD_SYSTEM_PROMPT = `너는 한국어 광고 카피라이터다.
사용자의 업종과 아이템을 듣고 광고 이미지에 어울리는 "분위기 키워드" 5개를 추천한다.
- 한국어, 6~10자 사이의 짧은 형용 표현
- 광고 사진의 스타일/감정/시간대를 묘사
- 서로 다른 톤이어야 함

반드시 다음 JSON 형식으로 응답: {"moods": ["...", "...", "...", "...", "..."]}
moods 배열에 5개의 한국어 표현을 채워라. 입력된 업종/아이템에 맞는 실제 분위기로 작성.`;

export async function recommendMoods(
  input: RecommendMoodsInput,
): Promise<string[]> {
  const client = getClient();
  const userMsg = [
    `업종: ${input.industry}`,
    `아이템: ${input.item}`,
    input.extraDescription ? `추가 설명: ${input.extraDescription}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: MOOD_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const moods = parsed["moods"];
  if (Array.isArray(moods)) {
    return moods
      .filter((v): v is string => typeof v === "string")
      .slice(0, 5);
  }
  // 폴백: 첫 번째 배열 값
  for (const v of Object.values(parsed)) {
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string").slice(0, 5);
    }
  }
  return [];
}

type ComposeAdImageInput = {
  personImagePath: string;
  productImagePath?: string;
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "low" | "medium" | "high";
};

type ComposeAdImageResult = {
  buffer: Buffer;
};

const mimeFor = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
};

const toUploadable = async (filePath: string) =>
  toFile(fs.createReadStream(filePath), path.basename(filePath), {
    type: mimeFor(filePath),
  });

export async function composeAdImage(
  input: ComposeAdImageInput,
): Promise<ComposeAdImageResult> {
  const client = getClient();

  const personFile = await toUploadable(input.personImagePath);
  const productFile = input.productImagePath
    ? await toUploadable(input.productImagePath)
    : null;

  const images = productFile ? [personFile, productFile] : [personFile];

  const result = await client.images.edit({
    model: "gpt-image-1",
    image: images,
    prompt: input.prompt,
    size: input.size ?? "1024x1024",
    quality: input.quality ?? "high",
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return { buffer: Buffer.from(b64, "base64") };
}
