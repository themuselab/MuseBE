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
 * EXPRESSION FRAMEWORK — 표정·시선 학술 근거.
 *
 * 광고학에서 모델 표정은 카테고리에 따라 효과가 다르다:
 *  - Essiz (2025) Psychology & Marketing: 럭셔리 광고에서 강한 미소 < 중립 표정
 *    (competence·credibility ↑). 6개 사전등록 연구에서 검증.
 *  - Peace, Miles & Johnston (2006): Duchenne smile(눈 주름)이 진정성·관대함 ↑.
 *  - Wang et al. (2017) Electronic Commerce Research: e-commerce 시선 추적 —
 *    Duchenne smile이 저강도일 때 attention·purchase intention 가장 높음.
 *  - Septianto et al. (Tourism Mgmt 2024): close-up=rational appeal,
 *    long-shot=emotional appeal.
 *
 * 업종별 권장 표정은 industryDesignCode의 expressionGuide 필드 참고.
 * 이 framework는 "왜 표정이 카테고리별로 다른가"의 prompt-side 명시 + 일반 룰.
 */
export const EXPRESSION_FRAMEWORK = `
EXPRESSION (face-swap 후 자연스러운 표정 신호):
- Choose expression intensity by category (see industry expressionGuide):
  · Luxury / formal (suit·finance·법률·자동차·럭셔리 패션):
      neutral or subtle closed-mouth smile, direct gaze (Essiz 2025)
  · Lifestyle / warmth (cafe·food·교육·복지):
      gentle Duchenne smile with eye crinkles (Peace 2006)
  · Beauty / hedonic (뷰티·화장품·미용실):
      serene soft smile or gentle confidence (Wang 2017 약한 강도)
  · Trust / health (병원·의료·금융 일부):
      reassuring soft Duchenne (warm + competent)
  · Energy / sport (헬스·여행·주류):
      determined or open Duchenne for activity
- Always: gaze directed at or near camera lens (direct eye contact = engagement)
- Avoid: forced grin, fake smile, exaggerated open mouth, anger, sadness
`.trim();

/**
 * CONTEXTUAL BACKGROUND FRAMEWORK — 배경 구성 학술 근거.
 *
 *  - Mandel & Johnson (2002) JCR 29(2): 컨텍스추얼 배경 priming이 product preference
 *    에 영향(자동차 사이트 배경 dollar/fire→가격/안전 priming). 단색보다 효과적.
 *  - Lee, Frederick & Ariely (2006) Psych Science: contextual revelation이 선호 변화.
 *  - Pieters & Wedel (2004) JoM 68(2): 단, 이미지 콘텐츠 max 65% 유지 — 배경이
 *    subject를 압도하면 안 됨. blurred / shallow DoF가 표준 해법.
 *  - Thematic-matched ads boost brand recall +40% (Integral Ad Science research).
 *
 * 업종별 권장 컨텍스트는 industryDesignCode의 backgroundContext 필드 참고.
 * 핵심: contextual but BLURRED, palette 톤 유지, subject focal 보존.
 */
export const CONTEXTUAL_BACKGROUND_FRAMEWORK = `
BACKGROUND (research-backed contextual priming, NOT flat color):
- Use a contextual environment matching the product use case (industry backgroundContext)
- ALWAYS render the background with shallow depth of field (blurred / soft bokeh)
  so the subject remains the focal point (Pieters & Wedel 2004 — subject ≤55% but
  background can carry contextual cues)
- Background tones must remain within the COLOR PALETTE (no off-palette drift)
- Avoid heavy clutter, busy patterns, or text/signs in the background
- Avoid pure flat color backgrounds — they lose Mandel & Johnson 2002 priming effect
- The background should evoke the product's natural setting (office for finance,
  cafe for coffee, clinic for medical) without overpowering the model+product
`.trim();

/**
 * FACE / SUBJECT PROPORTION FRAMEWORK — shot type + face % 학술 근거.
 *
 *  - Archer et al. (1983) Face-ism Index: face/total body 비율 ↑ → 지능·야심·진지함
 *    perception ↑. 비율 ↓ → 라이프스타일·신체 강조 (패션·럭셔리).
 *  - Sundar (2008) J of Adv: 풀바디 = lifestyle/aspirational, close-up = emotional.
 *  - Septianto et al. (2024): close-up=rational, long-shot=emotional.
 *  - D'Alessandro & Chitty (2011): 패션 광고는 모델 body shape이 brand attitude 핵심.
 *  - Bakhshi et al. (2014) CHI: 얼굴 보이면 engagement +38% — 단, 보이는 것이 핵심,
 *    무조건 close-up일 필요는 없음.
 *
 * 업종별 권장 shot type은 industryDesignCode의 faceProportion 필드 참고.
 */
export const FACE_PROPORTION_FRAMEWORK = `
FACE / SUBJECT PROPORTION (Archer 1983 face-ism + Sundar 2008 shot type):
- Match the shot type to the product category (industry faceProportion):
  · Fashion / clothing / luxury: full body or 3/4, face 8~15% of frame
    (outfit is the hero; Sundar 2008 lifestyle convention; D'Alessandro 2011)
  · Beauty / cosmetics / hair salon: close-up beauty shot, face 30~45%
    (Archer 1983 high face-ism = product=face; Bakhshi face engagement maximized)
  · Healthcare / professional / authority: 3/4 portrait, face 22~32%
    (Archer 1983 mid-high face-ism = competence/trust)
  · Food / cafe / drink: medium shot with food, face 18~24%
    (food/product is hero, model in context)
  · Tech / industrial / B2B: medium with product, face 18~26%
  · Tourism / sport / lifestyle: wide cinematic, face 12~18%
  · Default fallback: medium balanced, face 25~30%
- Bakhshi 2014: face MUST remain clearly visible regardless of shot type (engagement +38%)
- Pieters & Wedel 2004: total subject (model + product) ≤ 55~65% of frame
`.trim();
