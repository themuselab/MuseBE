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

// ──────────── 광고 카피 자동 생성 (편집 가능 텍스트 레이어용) ────────────

export type TextOverlay = {
  id: string;
  content: string;
  // 위치/크기는 캔버스 % 단위 (FE TextLayer와 동일 좌표계)
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string; // hex
  textAlign: "left" | "center" | "right";
};

export type AdCopyTone = "warm" | "casual" | "professional" | "elegant";

export type AdCopyResult = {
  headline: string;
  subhead: string;
  cta: string;
  tone: AdCopyTone;
};

const COPY_SYSTEM_PROMPT = `너는 한국어 광고 카피라이터다.
업종/아이템/분위기를 듣고 광고 이미지에 어울리는 헤드라인, 서브카피, CTA를 만든다.

규칙:
- 헤드라인: 6~14자 (모바일 한 줄 표시 가능, 강한 임팩트)
- 서브카피: 10~20자 (헤드라인을 뒷받침하는 부연)
- CTA: 4~8자 (예: "지금 만나보기", "오늘 오픈", "예약하기")
- 자영업 톤: 친근, 명확, 공감
- tone 분류: "warm" | "casual" | "professional" | "elegant" 중 하나

금지 표현 (표시광고법 위반):
- "최고", "1위", "유일", "100%", "완벽" 등 절대적 표현 금지
- 거짓 한정 ("오늘만", "단 N명")이 사실 아닌 경우 금지

업종별 추가 컴플라이언스:
- 의료/병원: "치료", "완치", "효과 100%", "신의 손" 금지 (의료법)
- 식품/카페/빵집: "치료", "예방", "건강에 좋다" 금지 (식품위생법)
- 화장품: "주름 제거", "기미 제거", "재생" 금지 (화장품법)

반드시 다음 JSON 형식으로만 응답:
{"headline":"...", "subhead":"...", "cta":"...", "tone":"warm"}`;

const DEFAULT_OVERLAY_LAYOUT = {
  headline: { x: 5, y: 8, width: 90, height: 14, textAlign: "left" as const },
  subhead: { x: 5, y: 22, width: 90, height: 8, textAlign: "left" as const },
  cta: { x: 60, y: 78, width: 35, height: 8, textAlign: "right" as const },
};

const ALLOWED_TONES: ReadonlySet<AdCopyTone> = new Set([
  "warm",
  "casual",
  "professional",
  "elegant",
]);

const sanitizeText = (raw: unknown, fallback: string): string => {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const sanitizeTone = (raw: unknown): AdCopyTone => {
  if (typeof raw === "string" && ALLOWED_TONES.has(raw as AdCopyTone)) {
    return raw as AdCopyTone;
  }
  return "warm";
};

export async function recommendAdCopy(input: {
  industry: string;
  item: string;
  mood?: string;
  extraDescription?: string;
}): Promise<AdCopyResult> {
  const client = getClient();
  const userMsg = [
    `업종: ${input.industry}`,
    `아이템: ${input.item}`,
    input.mood ? `분위기: ${input.mood}` : "",
    input.extraDescription ? `추가 설명: ${input.extraDescription}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: COPY_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  return {
    headline: sanitizeText(parsed.headline, ""),
    subhead: sanitizeText(parsed.subhead, ""),
    cta: sanitizeText(parsed.cta, ""),
    tone: sanitizeTone(parsed.tone),
  };
}

const TONE_TO_COLOR: Record<AdCopyTone, string> = {
  warm: "#1A1A1A",
  casual: "#1A1A1A",
  professional: "#FFFFFF",
  elegant: "#FFFFFF",
};

/**
 * AdCopyResult → TextOverlay[] 어댑터.
 * Job.textOverlays JSON 저장용. cta는 우하단 zone에 독립 배치.
 */
export function adCopyToOverlays(copy: AdCopyResult): TextOverlay[] {
  const color = TONE_TO_COLOR[copy.tone];
  const overlays: TextOverlay[] = [];

  if (copy.headline) {
    const layout = DEFAULT_OVERLAY_LAYOUT.headline;
    overlays.push({
      id: "headline",
      content: copy.headline,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      fontSize: 56,
      fontWeight: "bold",
      color,
      textAlign: layout.textAlign,
    });
  }

  if (copy.subhead) {
    const layout = DEFAULT_OVERLAY_LAYOUT.subhead;
    overlays.push({
      id: "subhead",
      content: copy.subhead,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      fontSize: 24,
      fontWeight: "normal",
      color,
      textAlign: layout.textAlign,
    });
  }

  if (copy.cta) {
    const layout = DEFAULT_OVERLAY_LAYOUT.cta;
    overlays.push({
      id: "cta",
      content: copy.cta,
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      fontSize: 28,
      fontWeight: "bold",
      color,
      textAlign: layout.textAlign,
    });
  }

  return overlays;
}

// ─────────────────────────────────────────────────────────────────────

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
    model: "gpt-image-2",
    image: images,
    prompt: input.prompt,
    size: input.size ?? "1024x1024",
    quality: input.quality ?? "high",
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return { buffer: Buffer.from(b64, "base64") };
}
