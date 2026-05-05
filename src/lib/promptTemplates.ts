/**
 * 학술 검증된 zone 룰 (Pieters & Wedel 2004, Bakhshi 2014)
 *
 * AI 측 ai/src/adgen/prompt_builder.py 의 ACADEMIC_LAYOUT_RULES 와 1:1 동기화.
 */
export const ACADEMIC_LAYOUT_RULES = `
ACADEMIC ZONE RULES (academic-validated):
- Subject (model + product) must NOT exceed 55% of total frame area
- Image content max 65%, blank zones min 35%
- Top-left 25% area: BLANK clean solid background for text overlay
- Bottom-right 20% area: BLANK clean solid background for CTA overlay
- Generous negative space — no edge-to-edge composition
- Reference: Pieters & Wedel (2004) Journal of Marketing 68(2), p.43
`.trim();

/**
 * GPT가 텍스트를 그리지 않도록 강제 (한국어 텍스트는 PIL이 후처리)
 */
export const TEXT_FREE_RULES = `
CRITICAL TEXT-FREE REQUIREMENTS:
- DO NOT render any Korean or English text in the image
- DO NOT add typography, captions, or written words
- DO NOT include any letters, numbers, or symbols
- The image must be visual-only — text will be added by PIL post-processing
- Leave designated text zones as clean solid background
`.trim();

/**
 * 광고 품질 기본 룰
 */
export const QUALITY_RULES = `
- Photorealistic professional commercial photography
- Magazine-grade editorial quality
- Natural skin texture (no plastic look, no doll-like appearance)
- Authentic Korean facial features (face engagement +38%, Bakhshi CHI 2014)
- Sharp focus on subject, gentle background
`.trim();
