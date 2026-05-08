/**
 * 학술 검증된 zone 룰 (Pieters & Wedel 2004, Bakhshi 2014)
 *
 * AI 측 ai/src/adgen/prompt_builder.py 의 ACADEMIC_LAYOUT_RULES 와 1:1 동기화.
 */
export const ACADEMIC_LAYOUT_RULES = `
ACADEMIC ZONE RULES (academic-validated, STRICT — text is overlaid post-process):
- Subject (model + product) must NOT exceed 55% of total frame area
- Image content max 65%, blank zones min 35%

POSITIONING (CRITICAL — text overlay zones must be BLANK BACKGROUND, no subject):
- Position the model/subject in the LOWER-RIGHT or CENTER-RIGHT half of the frame
- The TOP-LEFT THIRD of the frame must be ENTIRELY BLANK clean solid background
  (no head, no shoulders, no product, no decoration — only the backdrop color)
- Model's head/face must NOT enter the top-left third under any circumstance
- Bottom-right 20% area: also BLANK solid background (reserved for optional CTA)

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
 *
 * 주의: 텍스처 트리거(visible pores, stubble, slight asymmetry 등)는 배경·의상·
 * 피부 일반에 적용되지만, FACE_PRESENTATION_RULES가 face 영역만 별도 가이드함
 * (Stage 3 face-swap에서 catalog face로 교체될 영역이라 디테일 과잉이면 swap
 * 경계가 부각됨).
 */
export const QUALITY_RULES = `
- Ultra-photorealistic professional commercial photography
- Magazine-grade editorial quality, shot on 35mm Kodak Portra 400 film, unretouched RAW photo
- Natural skin texture with visible pores and fine wrinkles on hands/neck/exposed body skin
- Film grain throughout the image, lifelike skin tone, real human appearance
- Authentic Korean facial features (face engagement +38%, Bakhshi CHI 2014)
- Sharp focus on subject, gentle background
- No plastic, no airbrushing, no smoothing on body/clothing, no doll-like appearance, no idealized beauty filter
`.trim();

/**
 * Face-swap 친화 룰 — Stage 3 face-swap이 잘 처리하도록 face 영역 조건 강제.
 *
 * 배경·기저: 백엔드 파이프라인은 FLUX-LoRA로 scene을 생성한 뒤 fal-ai/face-swap
 * (InsightFace 계열 landmark 기반)으로 catalog 얼굴을 합성한다. landmark 검출이
 * 잘 되려면 face가 정면에 가깝고 균일 조명이어야 하며, 표정·각도가 너무 극단적
 * 이면 swap 경계가 부자연스러워진다. 또한 catalog 모델이 대부분 무수염·매끈한
 * 피부이기 때문에 scene face에 수염·강한 질감을 주면 swap 후 catalog face와
 * 텍스처 mismatch가 보인다 — face 영역만 단순하게 유지하는 게 안전하다.
 *
 * 모델링/test_faceswap_compare.py 에서 fal-ai/face-swap이 fal.ai의 다른 face-swap
 * 후보(easel-ai/advanced-face-swap deprecated, fal-ai/hy-wu-edit 미작동) 대비
 * 유일하게 정상 작동하는 것을 확인함. 따라서 face-swap을 교체하지 않고 입력
 * scene을 face-swap-friendly하게 만드는 방향으로 결정.
 */
export const FACE_PRESENTATION_RULES = `
FACE PRESENTATION (face-swap stage 3 호환 필수):
- Model facing FORWARD toward camera (frontal or near-frontal — max 20° head turn)
- Even balanced lighting on the face region (no chiaroscuro / no half-shadow on face)
- Clear unobstructed face — no hair covering eyes, no hand on face, no glasses glare,
  no microphone/object covering nose/mouth
- Eyes open and directed at or near the camera lens
- Neutral or gentle closed-mouth expression — avoid wide-open mouth, extreme laugh,
  shout, kiss, tongue out
- FACE AREA ONLY: clean smooth skin, NO stubble, NO heavy beard, NO heavy makeup,
  NO heavy texture on face (텍스처는 손·목·노출 피부에는 OK이지만 face는 매끈하게)
- (이 face 영역은 stage 3에서 catalog 모델의 얼굴로 교체되므로, scene의 face는
  단순한 placeholder처럼 유지해야 swap 결과가 자연스러움)
`.trim();
