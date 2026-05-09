/**
 * 학술 기반 자동 프롬프트 빌더 — slim v5
 *
 * 사용자 입력(industry, product, ...) → 학술 룰 + 업종 디자인 코드 결합 →
 * gpt-image-2/edit과 fal-ai/flux-lora 양쪽 모두에서 처리 가능한 concise prompt.
 *
 * v4 → v5 변경 (slim refactor):
 *   - v4 prompt 길이 ~7,600자(~3,000+ 토큰)가 FLUX-dev T5(512 토큰 한계)에서 후반부
 *     directive(BACKGROUND, MOOD)가 잘려 살롱 광고에서 살롱 컨텍스트가 prompt에 명시
 *     됐음에도 결과에 반영되지 않는 사례 production 보고됨.
 *   - 해결: 학술 framework 블록(EXPRESSION_FRAMEWORK / CONTEXTUAL_BACKGROUND_FRAMEWORK
 *     / FACE_PROPORTION_FRAMEWORK)을 prompt에서 제거하고 docstring·헤더에만 보존.
 *     industryDesignCode의 4 필드(paletteRationale, expressionGuide, backgroundContext,
 *     faceProportion) 값을 학술 인용 없이 actionable directive로 슬림화 (별도 PR).
 *   - 섹션 순서: SUBJECT → SHOT → EXPRESSION → BACKGROUND → COLORS → STYLE → MOOD →
 *     FACE STRUCTURE → LAYOUT → QUALITY → NO TEXT (기존 BACKGROUND 후반 → 전반으로 이동)
 *   - 결과 길이: ~1,500~2,000자 (T5 512 토큰 안에 들어감)
 *
 * 학술 근거 (전체 framework citations은 industryDesignCode.ts 헤더 참고):
 * - Bakhshi et al. (2014) CHI 2014 — face engagement +38%
 * - Pieters & Wedel (2004) JoM 68(2) — image size attention
 * - Essiz (2025) Psychology & Marketing — luxury 광고 표정 강도
 * - Mandel & Johnson (2002) JCR 29(2) — 컨텍스추얼 배경 priming
 * - Archer et al. (1983) Face-ism Index — face/body 비율 perception
 * - Sundar (2008) J of Adv — shot type by category
 */
import { getDesignCode } from "./industryDesignCode";
import {
  ACADEMIC_LAYOUT_RULES,
  FACE_PRESENTATION_RULES,
  QUALITY_RULES,
  TEXT_FREE_RULES,
} from "./promptTemplates";

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
  let persona = input.modelPersona ?? code.modelPersona;
  if (input.modelGender) {
    const gender = input.modelGender === "F" ? "female" : "male";
    const inIdx = persona.indexOf(" in ");
    const personaCore = inIdx >= 0 ? persona.slice(0, inIdx) : persona;
    const ageSuffix = input.modelAge ? ` in ${input.modelAge}s` : "";
    persona = `Korean ${gender} model${ageSuffix}, ${personaCore}`;
  }

  const accentLine = code.palette[2] ? `Accent: ${code.palette[2]}` : "";

  // ── slim prompt: 핵심 directive를 prompt 전반부에 배치해 FLUX T5 512 토큰 안에 ──
  return `
Korean ${input.industry} advertisement, premium ad agency quality.

═══ SUBJECT ═══
${persona}, authentic Korean facial features, face clearly visible.

═══ SHOT (composition) ═══
${code.faceProportion}

═══ EXPRESSION ═══
${code.expressionGuide}

═══ BACKGROUND ═══
${code.backgroundContext}
Render with shallow depth of field (soft bokeh) — subject must remain the focal point.
Background tones must stay within the COLOR PALETTE — no off-palette drift.

═══ COLOR PALETTE ═══
Primary: ${code.palette[0]}
Secondary: ${code.palette[1]}
${accentLine}
Strict adherence to these EXACT hex values — no off-brand color drift.
${code.paletteRationale}

═══ IMAGE STYLE ═══
${code.imageStyle}

═══ MOOD ═══
${code.mood}. Reference: ${code.examples}.

${FACE_PRESENTATION_RULES}

═══ LAYOUT ═══
${code.layout}
Aspect ratio: ${aspect} ${aspectDescription(aspect)}.
${ACADEMIC_LAYOUT_RULES}

═══ QUALITY ═══
${QUALITY_RULES}

${TEXT_FREE_RULES}
`.trim();
}

/**
 * 짧은 버전 — 학술 룰 핵심만 포함 (디버깅/로깅용)
 */
export function buildAdImagePromptShort(input: AdInput): string {
  const code = getDesignCode(input.industry);
  return (
    `Korean ${input.industry} ad poster, ${code.mood}, ` +
    `${code.faceProportion}, ${code.expressionGuide} ` +
    `Background: ${code.backgroundContext} ` +
    `Palette: ${code.palette.slice(0, 3).join(" ")}, ` +
    `Reference: ${code.examples}, ` +
    `Model: ${code.modelPersona}. ` +
    `DO NOT render any text — visual only, blank zones for PIL overlay.`
  );
}
