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

export type MoodRecommendation = {
  id: string;
  label: string;
  subtitle: string;
  ranking: "AI PICK" | null;
};

const MOOD_SYSTEM_PROMPT = `너는 한국어 광고 카피라이터다.
사용자의 업종과 아이템을 듣고 광고 이미지에 어울리는 "분위기" 5개를 추천한다.

각 분위기는 다음 필드를 가져야 한다:
- id: 영어 슬러그 (소문자, 하이픈, 1-2단어, 예: "calm", "fresh", "luxury")
- label: 한국어 형용사 형태, 2~5자 (예: "차분한", "청량한", "고급스러운")
- subtitle: 한국어 한 줄 부제, 10~20자 (예: "소프트하고 부드러운 무드")

서로 다른 톤이어야 하고, 입력된 업종/아이템에 맞는 실제 분위기로 작성한다.

반드시 다음 JSON 형식으로 응답:
{"moods": [{"id":"...","label":"...","subtitle":"..."}, ...]}
moods 배열에 정확히 5개를 채워라. 첫 번째 항목이 가장 추천하는 것.`;

const fallbackId = (idx: number) => `mood-${idx}`;

const normalizeMood = (
  raw: unknown,
  idx: number,
): MoodRecommendation | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" && obj.id.length > 0 ? obj.id : fallbackId(idx);
  const label = typeof obj.label === "string" ? obj.label : null;
  const subtitle = typeof obj.subtitle === "string" ? obj.subtitle : "";
  if (!label) return null;
  return {
    id,
    label,
    subtitle,
    ranking: idx === 0 ? "AI PICK" : null,
  };
};

export async function recommendMoods(
  input: RecommendMoodsInput,
): Promise<MoodRecommendation[]> {
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
  const moodsRaw = parsed["moods"];
  const arr = Array.isArray(moodsRaw)
    ? moodsRaw
    : (Object.values(parsed).find(Array.isArray) as unknown[] | undefined) ??
      [];

  const ids = new Set<string>();
  const result: MoodRecommendation[] = [];
  for (let i = 0; i < arr.length && result.length < 5; i++) {
    const item = normalizeMood(arr[i], result.length);
    if (!item) continue;
    if (ids.has(item.id)) item.id = `${item.id}-${i}`;
    ids.add(item.id);
    result.push(item);
  }
  return result;
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
