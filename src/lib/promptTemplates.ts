/**
 * 학술 검증된 zone 룰 (Pieters & Wedel 2004, Bakhshi 2014)
 *
 * AI 측 ai/src/adgen/prompt_builder.py 의 ACADEMIC_LAYOUT_RULES 와 1:1 동기화.
 */
export const ACADEMIC_LAYOUT_RULES = `
ACADEMIC ZONE RULES (academic-validated, STRICT — text is overlaid post-process):
- Subject (model + product) must NOT exceed 55% of total frame area
- Image content max 65%, blank zones min 35%

POSITIONING (CRITICAL — text overlay zones must be UNCLUTTERED, no subject):
- Position the model/subject in the LOWER-RIGHT or CENTER-RIGHT half of the frame
- The TOP-LEFT THIRD of the frame must be UNCLUTTERED low-detail backdrop
  (blurred contextual background OK — see BACKGROUND section — but NO model/face/
   shoulders/product/sharp decoration/text in the top-left third)
- Model's head/face must NOT enter the top-left third under any circumstance
- Bottom-right 20% area: also UNCLUTTERED low-detail (reserved for optional CTA)

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
 * 배경: fal-ai/face-swap(landmark 기반)이 잘 작동하려면 face가 정면 + 균일 조명 +
 * 매끈한 표면이어야 함. 표정 자체는 EXPRESSION 섹션(expressionGuide)에서 업종별로
 * 별도 처리하므로 여기서는 STRUCTURE만 다룬다.
 */
export const FACE_PRESENTATION_RULES = `
FACE PRESENTATION (face-swap stage 3 호환 — 구조 조건):
- Model facing FORWARD toward camera (frontal or near-frontal — max 20° head turn)
- Even balanced lighting on the face region (no chiaroscuro / no half-shadow on face)
- Clear unobstructed face — no hair covering eyes, no hand on face, no glasses glare,
  no microphone/object covering nose/mouth
- Eyes open and directed at or near the camera lens
- Mouth closed or only slightly open — avoid wide-open mouth, extreme laugh, shout,
  kiss, tongue out (표정 자체는 EXPRESSION 섹션 참고)
- FACE AREA ONLY: clean smooth skin, NO stubble, NO heavy beard, NO heavy makeup,
  NO heavy texture on face (텍스처는 손·목·노출 피부에는 OK이지만 face는 매끈하게)
- (이 face 영역은 stage 3에서 catalog 모델의 얼굴로 교체되므로, scene의 face는
  단순한 placeholder처럼 유지해야 swap 결과가 자연스러움)
`.trim();

/**
 * 표정·배경·shot type 학술 framework (slim v5에서 prompt 직접 주입은 제거)
 *
 * v4까지는 EXPRESSION_FRAMEWORK / CONTEXTUAL_BACKGROUND_FRAMEWORK /
 * FACE_PROPORTION_FRAMEWORK 상수로 prompt에 직접 주입했으나, 모든 카테고리 가이드를
 * 매 호출 prompt에 박아 토큰 낭비가 컸음 (~5,500 토큰/호출). 그 결과 FLUX-dev T5
 * (512 토큰 한계)에서 후반부 BACKGROUND directive가 잘려 살롱 광고에서 살롱 컨텍스트
 * 가 prompt에 명시됐어도 결과에 반영되지 않는 사례 production 보고됨.
 *
 * v5 변경: 학술 인용·일반 룰은 industryDesignCode.ts 헤더 docstring에만 보존하고,
 * runtime prompt는 industryDesignCode 4 필드(paletteRationale·expressionGuide·
 * backgroundContext·faceProportion)의 slim actionable directive만 사용.
 *
 * 본 framework 학술 출처 (인용·요약):
 *   - Essiz (2025) Psychology & Marketing — 럭셔리 광고 강한 미소 < 중립
 *   - Peace, Miles & Johnston (2006) — Duchenne smile → 진정성 ↑
 *   - Wang et al. (2017) E-Commerce Research — Duchenne smile 저강도가 attention 최대
 *   - Mandel & Johnson (2002) JCR 29(2) — 컨텍스추얼 배경 priming
 *   - Lee, Frederick & Ariely (2006) Psych Science — contextual revelation
 *   - Pieters & Wedel (2004) JoM 68(2) — 이미지 콘텐츠 max 65%
 *   - Archer et al. (1983) Face-ism Index — face/body 비율 perception
 *   - Sundar (2008) J of Adv — full body=lifestyle, close-up=emotional
 *   - Septianto et al. (2024) Tourism Mgmt — close-up=rational, long-shot=emotional
 *   - D'Alessandro & Chitty (2011) — 패션 광고는 body shape 핵심
 *   - Bakhshi et al. (2014) CHI — face engagement +38%
 *
 * 향후 필요 시 build-time tooling으로 docstring → 마크다운 가이드를 자동 생성 가능.
 */
