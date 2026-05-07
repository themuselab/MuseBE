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
 *
 * 자연 톤 트리거(8개)는 모델링/ pre-train rescue 테스트(variant I)에서 검증.
 * Muse v3 LoRA 학습 시 EMA·5000step·rank 32 조합으로 텍스처가 평균화돼
 * plasticky 잔재가 있는데, 이 트리거 + Realism 1.0 booster + negative prompt
 * 조합으로 추론 단에서 자연 톤이 회복됨.
 *
 * GPT-image-2/edit이 avatars_6pose 데이터셋을 만들 때 사용한 것과 동일 트리거.
 */
export const QUALITY_RULES = `
- Ultra-photorealistic professional commercial photography
- Magazine-grade editorial quality, shot on 35mm Kodak Portra 400 film, unretouched RAW photo
- Natural skin texture with visible pores, fine wrinkles, and subtle imperfections
- Film grain, lifelike skin tone, slight asymmetry, real human face
- Stubble allowed for male subjects, no makeup glow on female subjects
- Authentic Korean facial features (face engagement +38%, Bakhshi CHI 2014)
- Sharp focus on subject, gentle background
- No plastic, no airbrushing, no smoothing, no doll-like appearance, no idealized beauty filter
`.trim();
