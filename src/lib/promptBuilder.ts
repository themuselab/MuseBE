/**
 * 학술 기반 자동 프롬프트 빌더
 *
 * 사용자 입력(industry, product, ...) → 학술 룰 + 업종 디자인 코드 결합 →
 * gpt-image-2용 텍스트 프롬프트.
 *
 * GPT는 텍스트 없는 비주얼만 생성. 한국어 텍스트는 PIL이 후처리(흰디 패턴).
 *
 * 학술 근거:
 * - Bakhshi et al. (2014) CHI 2014, p.969 — face engagement +38%
 * - Pieters & Wedel (2004) Journal of Marketing 68(2), p.43 — image size attention
 */
import { getDesignCode } from "./industryDesignCode";
import { ACADEMIC_LAYOUT_RULES, QUALITY_RULES, TEXT_FREE_RULES } from "./promptTemplates";

export type AspectRatio = "9:16" | "1:1" | "16:9";

export type AdInput = {
  industry: string;
  product: string;
  aspectRatio?: AspectRatio;
  modelGender?: "F" | "M";
  modelAge?: number;
  modelPersona?: string;
};

function aspectDescription(aspect: AspectRatio): string {
  if (aspect === "9:16") return "vertical portrait";
  if (aspect === "1:1") return "square";
  return "horizontal landscape";
}

export function buildAdImagePrompt(input: AdInput): string {
  const code = getDesignCode(input.industry);
  const aspect = input.aspectRatio ?? "9:16";

  // 모델 페르소나 — 사용자 입력 우선, 없으면 디자인 코드 기본값.
  // gender만 있어도 적용 (face swap이 face만 교체하므로 의상·포즈는 base scene gender 따름).
  let persona = input.modelPersona ?? code.modelPersona;
  if (input.modelGender) {
    const gender = input.modelGender === "F" ? "female" : "male";
    const inIdx = persona.indexOf(" in ");
    const personaCore = inIdx >= 0 ? persona.slice(0, inIdx) : persona;
    const ageSuffix = input.modelAge ? ` in ${input.modelAge}s` : "";
    persona = `Korean ${gender} model${ageSuffix}, ${personaCore}`;
  }

  const frameworkNote = `[Academic basis: ${code.framework} — ${code.academicRef}]`;
  const accentLine = code.palette[2] ? `Accent: ${code.palette[2]}` : "";

  return `
${frameworkNote}

Korean ${input.industry} advertisement campaign — premium professional ad agency quality.

═══ MODEL ═══
Featuring authentic ${persona}, natural Korean facial features.
Face must be clearly visible (Bakhshi CHI 2014 — engagement +38%).

═══ LAYOUT (Strict Zone Allocation) ═══
${code.layout}
Aspect ratio: ${aspect} ${aspectDescription(aspect)}.

${ACADEMIC_LAYOUT_RULES}

═══ TYPOGRAPHY (Reference Only — DO NOT render text) ═══
${code.typography}
(Note: text styling is for PIL post-processing reference only.
 The image must contain NO text — see TEXT-FREE rules below.)

═══ COLOR PALETTE (research-backed — paletteRationale 참조) ═══
Primary: ${code.palette[0]}
Secondary: ${code.palette[1]}
${accentLine}
- Strict adherence to these EXACT hex values — no off-brand color drift
- Do NOT warm-shift cool palettes (e.g., navy must stay navy, not amber/sand)
- Do NOT cool-shift warm palettes (e.g., caramel must stay caramel, not gray)
- Background MUST be a single muted desaturated tone (avoid vivid orange/red unless
  palette explicitly includes that hue as Primary or Secondary)
- Rationale: ${code.paletteRationale}

═══ IMAGE STYLE ═══
${code.imageStyle}

═══ MOOD ═══
${code.mood}
Reference brands/campaigns: ${code.examples}.

═══ APPEAL TYPE ═══
${code.appeal} appeal — ${code.expression}.

${TEXT_FREE_RULES}

═══ QUALITY ═══
${QUALITY_RULES}

═══ OUTPUT REQUIREMENTS ═══
- Print-ready ad poster quality
- High resolution detail
- No watermarks, no stock-photo logos
- Clean composition with intentional negative space
- Top-left and bottom-right zones must remain BLANK for PIL text overlay
`.trim();
}

/**
 * 짧은 버전 — 학술 룰 핵심만 포함 (디버깅/로깅용)
 */
export function buildAdImagePromptShort(input: AdInput): string {
  const code = getDesignCode(input.industry);
  const layoutPreview = code.layout.slice(0, 200);
  return (
    `Korean ${input.industry} ad poster, ${code.mood}, ${layoutPreview}, ` +
    `palette ${code.palette.slice(0, 3).join(" ")}, ` +
    `reference: ${code.examples}, ` +
    `model: ${code.modelPersona}. ` +
    `DO NOT render any text — visual only, blank zones for PIL overlay.`
  );
}
