/**
 * 업종별 광고 디자인 코드 — v4 (zone + palette + expression + background + face proportion)
 *
 * AI 측 `ai/src/adgen/industry_design_code.py` 와 1:1 동기화.
 * Python 원본의 dict[str, dict]를 TS로 그대로 옮긴 형태.
 *
 * ─── 학술 근거 (모델·레이아웃 — academicRef 필드) ───
 * 1. Vaughn (1986) FCB Grid — 관여도 × 이성/감성
 * 2. Holbrook & Hirschman (1982) — Hedonic vs Utilitarian
 * 3. Pieters & Wedel (2004) JoM 68(2) — image size attention
 * 4. Bakhshi et al. (2014) CHI 2014 — face engagement +38%
 * 5. 한양대 광고 메타분석 175편 — 모델-제품 매칭 +24.8%
 *
 * ─── 학술 근거 (color/palette — paletteRationale 필드) ───
 * 6. Labrecque & Milne (2012) JAMS 40(5) — color hue → brand personality
 *    빨강=excitement, 파랑=competence/trust, 노랑=sincerity,
 *    보라=sophistication, 초록=ruggedness/peace
 * 7. Hagtvedt & Brakus (2009) JCR 36(4) — 채도 ↓ → premium 지각 ↑
 * 8. Mehta & Zhu (2009) Science 323 — 빨강=detail/주의, 파랑=creative
 * 9. Bottomley & Doyle (2006) JMR 23 — functional=blue/black,
 *    sensory-social=warm/colorful
 * 10. Bagchi & Cheema (2013) JCP 23(2) — 빨강=urgency/action; 가격 표현
 * 11. Singh (2006) Mgmt. Decision 44 — 첫 90초 색상이 60~90% 결정
 * 12. Aslam (2006) J. Marketing Comm 12 — 한국·동아시아 색상 의미
 *     (흰색=청결/순수, 빨강=축제/행운, 파랑=신뢰, gold=권위)
 *
 * ─── 학술 근거 (expression — expressionGuide 필드) ───
 * 13. Essiz (2025) Psychology & Marketing — 럭셔리 광고에서 강한 미소 < 중립
 *     (competence·credibility ↑, 6 사전등록 연구)
 * 14. Peace, Miles & Johnston (2006) — Duchenne smile(눈 주름) → 진정성·관대함 ↑
 * 15. Wang et al. (2017) E-Commerce Research — Duchenne smile 저강도가 attention·
 *     purchase intention 가장 높음 (eye-tracking)
 *
 * ─── 학술 근거 (background — backgroundContext 필드) ───
 * 16. Mandel & Johnson (2002) JCR 29(2) — 컨텍스추얼 배경 priming이 product
 *     preference에 영향 (자동차 사이트 dollar/fire 배경 → 가격/안전 priming)
 * 17. Lee, Frederick & Ariely (2006) Psych Science — contextual revelation
 *
 * ─── 학술 근거 (face proportion — faceProportion 필드) ───
 * 18. Archer et al. (1983) Face-ism Index — face/body 비율 ↑ → 지능·야심·진지함
 *     perception ↑; 비율 ↓ → 신체·라이프스타일 강조
 * 19. Sundar (2008) J of Adv — full body=lifestyle/aspirational, close-up=emotional
 * 20. Septianto et al. (2024) Tourism Mgmt — close-up=rational, long-shot=emotional
 * 21. D'Alessandro & Chitty (2011) — 패션 광고는 모델 body shape이 brand attitude 핵심
 *
 * v3 → v4 변경:
 *   - DesignCode에 expressionGuide·backgroundContext·faceProportion 3 필드 추가
 *   - 36 업종 전수 학술 매핑 (Essiz 2025 / Mandel 2002 / Archer 1983 / Sundar 2008)
 *   - 정장 등 럭셔리 광고에서 모델 표정 어색·배경이 단색만·얼굴 너무 큼 production
 *     보고에 대한 학술 근거 기반 해법.
 *
 * v2 → v3 변경:
 *   - DesignCode에 paletteRationale 필드 추가 (36 업종 전수 학술 매핑)
 *   - sand accent(#C4A57B) 제거 — Koda LoRA·warm prompt 결합 시 오렌지로 워밍
 *     드리프트해 의도된 저채도 sophistication과 어긋나는 사례 production 보고됨.
 *     · 패션·의류 / 옷가게: deep navy(#1F2A44)로 교체 (Labrecque 검정/navy=sophistication)
 *     · 미용실·살롱: charcoal(#3E3E3E)로 교체 (살롱 차별화, Hagtvedt 저채도 유지)
 */

export type DesignCode = {
  framework: string;
  academicRef: string;          // 모델·레이아웃 학술 근거
  modelPersona: string;
  appeal: string;
  expression: string;
  layout: string;
  typography: string;
  palette: string[];
  paletteRationale: string;     // palette/color 학술 근거 (Labrecque, Hagtvedt 등)
  expressionGuide: string;      // 표정 학술 근거 (Essiz 2025, Peace 2006, Wang 2017)
  backgroundContext: string;    // 컨텍스추얼 배경 (Mandel & Johnson 2002)
  faceProportion: string;       // shot type + face % (Archer 1983, Sundar 2008)
  imageStyle: string;
  mood: string;
  examples: string;
  compliance?: string;
};

export const INDUSTRY_DESIGN_CODE: Record<string, DesignCode> = {
  // ════════════════════════════════════════════════════════
  // 고관여 + 이성 (전문성·신뢰감 — Centered Layout)
  // ════════════════════════════════════════════════════════
  "금융·보험": {
    framework: "high-involvement rational",
    academicRef: "전문가 모델 +9.5% (한양대 메타분석)",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑=competence/trust. " +
      "Bottomley & Doyle (2006): 금융=functional 카테고리, blue/black 권장. " +
      "Hagtvedt & Brakus (2009): 저채도→premium 지각.",
    expressionGuide:
      "Essiz 2025: 럭셔리·고관여 함수 → 중립 직시 표정 (직접 미소보다 competence·credibility ↑). " +
      "Wang 2017: 약한 closed-mouth 미소까지는 허용 — 강한 미소는 신뢰성 저하.",
    backgroundContext:
      "Mandel & Johnson 2002 priming: 금융 컨텍스트는 modern office / financial district / clean glass partition. " +
      "Blurred shallow DoF로 subject 강조 (Pieters 65% 룰).",
    faceProportion:
      "Sundar 2008 long-shot=emotional / closeup=rational 중 금융=rational → 3/4 portrait, face 22~28% of frame. " +
      "Archer 1983 face-ism: 전문성 perception 위해 face prominence 중상.",
    modelPersona: "trustworthy professional 30~40s in business attire",
    appeal: "rational",
    expression: "direct (numbers, data, facts)",
    layout:
      "CENTERED COMPOSITION (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 50%: MODEL frontal portrait (45% of frame)\n" +
      "- Background: clean office or neutral studio\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Bottom-left 10%: BLANK for trust signals (logo)\n" +
      "- Subject max 50% of frame\n" +
      "- Text zones min 40%",
    typography: "geometric sans-serif (Pretendard SemiBold), 1.4x line height",
    palette: ["#0A2540 (deep navy)", "#FFFFFF (white)", "#0066FF (accent blue)"],
    imageStyle: "concrete professional photography, clean composition, business attire",
    mood: "trustworthy, authoritative, data-driven, premium",
    examples: "삼성생명·KB국민은행·현대카드 톤",
  },
  "보건·의료": {
    framework: "high-involvement rational + warm",
    academicRef: "신뢰성+편안함 결합 (Bakhshi face +38%)",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑/초록=trust/health. " +
      "Aslam (2006): 한국 흰색=청결·순수. " +
      "Bottomley & Doyle (2006): functional 카테고리, blue/white 권장.",
    expressionGuide:
      "Peace 2006 Duchenne smile (눈 주름) → trust + reassurance. " +
      "Essiz 2025: 너무 환한 미소는 의료 신뢰성 저하; 부드러운 closed-mouth Duchenne 권장.",
    backgroundContext:
      "Mandel & Johnson 2002: 의료 컨텍스트 = blurred clean clinic patient room / soft natural light corridor. " +
      "Pale blue·white palette 톤 유지.",
    faceProportion:
      "3/4 trustworthy portrait, face 22~28% — Archer 1983 직업적 신뢰성 perception 적정.",
    modelPersona: "trustworthy comforting 30~50s in medical white coat",
    appeal: "rational + reassuring",
    expression: "direct + warm",
    layout:
      "CENTERED COMPOSITION (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 50%: MEDICAL PROFESSIONAL frontal portrait (45% of frame)\n" +
      "- Background: soft clinical white or warm neutral\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 50% of frame\n" +
      "- Generous breathing room, soft rounded composition",
    typography: "humanist sans-serif (Pretendard Regular + Bold for emphasis)",
    palette: ["#E8F4F8 (light cyan)", "#FFFFFF", "#2A7F62 (medical green)"],
    imageStyle: "natural soft lighting, gentle smile, white/sterile but warm",
    mood: "reassuring, professional, caring, hygienic",
    examples: "병원 광고·약국 톤",
    compliance: "최고/완치/효과100%/신의손 사용 금지 (의료법)",
  },
  "법률·경찰·소방·교도·국방": {
    framework: "high-involvement rational",
    academicRef: "신뢰성·전문성 (Bakhshi face +38%)",
    paletteRationale:
      "Labrecque & Milne (2012): 검정=sophistication/authority brand personality. " +
      "Aslam (2006): gold=prestige(고대 한자권 황금=권위). " +
      "Hagtvedt & Brakus (2009): 저채도+검정=premium 권위.",
    expressionGuide:
      "Essiz 2025 럭셔리·authority 카테고리: neutral expression > smile. " +
      "Peace 2006: subtle Duchenne 가능하나 entry는 authoritative neutral.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred law office / formal interior with bookshelf / dark wood paneling. " +
      "검정·gold 톤 유지.",
    faceProportion:
      "Archer 1983 high face-ism → authority perception ↑. " +
      "Portrait 3/4, face 28~35%.",
    modelPersona: "authoritative confident 40~50s in formal suit",
    appeal: "rational",
    expression: "direct (authority signals)",
    layout:
      "CENTERED MONOLITHIC (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 55%: PROFESSIONAL frontal portrait, dignified pose (50% of frame)\n" +
      "- Background: dark formal or law office setting\n" +
      "- Bottom-center 20%: BLANK for CTA overlay\n" +
      "- Subject max 50% of frame\n" +
      "- Strong vertical hierarchy",
    typography: "serif display headline (Cormorant) + clean sans body",
    palette: ["#1A1A1A (black)", "#FFFFFF", "#8B6914 (legal gold)"],
    imageStyle: "stately formal, dramatic side lighting",
    mood: "authoritative, established, dignified",
    examples: "법무법인·로펌 광고 톤",
  },
  "전기·전자·정보통신": {
    framework: "high-involvement rational",
    academicRef: "스펙·기능 강조 효과 ↑ + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑=competence + innovation 연상. " +
      "Bottomley & Doyle (2006): tech=functional, blue/black 권장. " +
      "Mehta & Zhu (2009): 파랑=creative cognition 활성화.",
    expressionGuide:
      "Septianto 2024: 기능재 광고 → rational appeal. " +
      "Confident neutral / 약한 closed-mouth smile. " +
      "Essiz 2025 럭셔리 tech: neutral 효과적.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred minimal tech studio / sleek device backdrop / subtle gradient surface. " +
      "Black·white·cyan 톤 유지.",
    faceProportion:
      "Sundar 2008: 제품 demonstrative → medium with product. " +
      "Face 18~24% (제품과 균형).",
    modelPersona: "professional sophisticated 20~30s tech-savvy demeanor",
    appeal: "rational + future-tech",
    expression: "direct + visual demos",
    layout:
      "ASYMMETRIC TECH GRID (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center-left 40%: MODEL with product/device (40% of frame)\n" +
      "- Right 25%: tech UI elements / product detail\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + product) max 55% of frame",
    typography: "modern geometric sans (Pretendard) + monospace data",
    palette: ["#0F0F0F", "#FFFFFF", "#00D4FF (cyber blue)", "#7B2FFF (tech purple)"],
    imageStyle: "sleek studio with subtle gradient, tech-forward, model interacting with device",
    mood: "innovative, premium tech, future-forward",
    examples: "삼성전자·LG전자·SK텔레콤 톤",
  },
  "자동차": {
    framework: "high-involvement rational + emotional",
    academicRef: "라이프스타일 + 스펙 균형 (Bakhshi face +38%)",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 저채도 검정/silver=luxury·premium. " +
      "Bottomley & Doyle (2006): 자동차=고관여 functional, 무채색 권장. " +
      "Labrecque & Milne (2012): 검정=sophistication·excitement 균형.",
    expressionGuide:
      "Essiz 2025 럭셔리 카테고리: aspirational neutral 또는 약한 closed-mouth. " +
      "Wang 2017: 강한 미소 비추천.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred showroom or scenic golden-hour road / cinematic landscape. " +
      "검정·silver 톤 유지.",
    faceProportion:
      "Sundar 2008 wide cinematic = aspirational lifestyle. " +
      "Face 8~12% (차량 hero).",
    modelPersona: "confident sophisticated 30~40s by vehicle",
    appeal: "rational + lifestyle aspiration",
    expression: "direct + cinematic",
    layout:
      "WIDE CINEMATIC (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 60%: MODEL standing by VEHICLE (model 25% + vehicle 35%)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 65% of frame",
    typography: "wide condensed sans (Bebas-style) + clean body",
    palette: ["#1A1A1A", "#FFFFFF", "#C0C0C0 (silver)"],
    imageStyle: "automotive photography, golden hour or studio, model + car composition",
    mood: "powerful, refined, aspirational",
    examples: "현대·기아·BMW 톤",
  },

  // ════════════════════════════════════════════════════════
  // 고관여 + 감성 (세련됨·매력성 — Asymmetric Editorial)
  // ════════════════════════════════════════════════════════
  "패션·의류": {
    framework: "high-involvement emotional",
    academicRef: "매력성 효과 가장 강한 카테고리 (한양대 +24.8%)",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 저채도→premium·luxury 지각 (sand accent 워밍 드리프트로 navy로 교체). " +
      "Labrecque & Milne (2012): 검정/navy=sophistication brand personality. " +
      "Singh (2006): 첫 90초 60~90% 색상 결정 — 명확한 monochrome 선호.",
    expressionGuide:
      "Essiz 2025: 패션 럭셔리 카테고리 → neutral editorial expression이 ad credibility 가장 높음. " +
      "직접 미소 < 절제된 closed-mouth + direct gaze.",
    backgroundContext:
      "Mandel & Johnson 2002 + Pieters 2004: blurred urban architecture / minimal gallery wall / atelier corner. " +
      "Cream·검정·navy palette 톤 유지, shallow DoF.",
    faceProportion:
      "Sundar 2008 + D'Alessandro 2011: 패션은 outfit hero → full body or 3/4 body, face 8~15%. " +
      "Archer 1983 low face-ism = body·lifestyle 강조.",
    modelPersona: "sophisticated editorial 20~30s wearing the seasonal outfit",
    appeal: "emotional + aspirational",
    expression: "metaphorical (mood, lifestyle)",
    layout:
      "ASYMMETRIC EDITORIAL (얼굴 포함):\n" +
      "- Top-left 30%: BLANK for headline overlay (oversized display)\n" +
      "- Right 50%: MODEL in styled outfit, full or 3/4 body (50% of frame)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Generous whitespace, magazine spread feel\n" +
      "- Subject max 55% of frame",
    typography: "modern serif display (Cormorant Garamond) + minimal sans subhead",
    palette: ["#F5F0E6 (cream)", "#1A1A1A", "#1F2A44 (deep navy accent)"],
    imageStyle: "editorial fashion photography, dramatic side light, 3/4 angle, magazine quality",
    mood: "sophisticated, refined, aspirational, magazine editorial",
    examples: "Jacquemus·COS·Acne Studios 톤",
  },
  "옷가게": {
    framework: "high-involvement emotional",
    academicRef: "매력성 효과 극대화 (한양대 +24.8%)",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 저채도→premium 지각 (sand accent 워밍 드리프트로 navy로 교체). " +
      "Labrecque & Milne (2012): 검정/navy=sophistication. " +
      "Bottomley & Doyle (2006): 패션=sensory-social, but premium positioning은 muted neutral.",
    expressionGuide:
      "Essiz 2025 럭셔리 패션: neutral editorial. " +
      "Direct gaze + subtle confidence.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred boutique interior / fashion atelier / clean architectural backdrop. " +
      "Cream·검정·navy 유지.",
    faceProportion:
      "패션 = outfit hero (Sundar 2008). " +
      "Full body or 3/4, face 8~15%.",
    modelPersona: "sophisticated editorial 20~30s wearing seasonal outfit",
    appeal: "emotional",
    expression: "metaphorical",
    layout:
      "ASYMMETRIC EDITORIAL (얼굴 포함):\n" +
      "- Top-left 30%: BLANK for headline overlay\n" +
      "- Right 50%: MODEL in styled outfit (50% of frame)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "modern serif display + minimal sans",
    palette: ["#F5F0E6", "#1A1A1A", "#1F2A44"],
    imageStyle: "editorial fashion, dramatic light, magazine quality",
    mood: "sophisticated, refined, editorial",
    examples: "Jacquemus·COS 톤",
  },
  "뷰티·화장품": {
    framework: "high-involvement emotional + hedonic",
    academicRef: "hedonic + abstract image 매칭 + Bakhshi face +38%",
    paletteRationale:
      "Bottomley & Doyle (2006): 뷰티=sensory-social 카테고리, warm pastel 권장. " +
      "Hagtvedt & Brakus (2009): pearl/blush 저채도=luxury 지각. " +
      "Aslam (2006): gold=prestige 동아시아 일관. " +
      "Labrecque & Milne (2012): 분홍=warmth/sincerity.",
    expressionGuide:
      "Wang 2017: 뷰티 e-commerce → 약한 Duchenne smile이 attention·purchase intention ↑. " +
      "Peace 2006: serene Duchenne (눈 주름 + 가벼운 closed-mouth).",
    backgroundContext:
      "Mandel & Johnson 2002: blurred bath/spa or natural window light / soft pastel surface. " +
      "Pearl·blush·gold palette 톤 유지.",
    faceProportion:
      "Archer 1983 face-ism: 뷰티는 face=hero → close-up beauty. " +
      "Face 30~45% of frame. " +
      "Bakhshi 2014 face engagement +38% 극대화.",
    modelPersona: "fresh dewy 20s OR mature elegant 30~40s, beauty close-up",
    appeal: "emotional + sensorial",
    expression: "abstract (texture, glow, sensation)",
    layout:
      "BEAUTY DUAL PANEL (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center-left 45%: MODEL face close-up (45% of frame)\n" +
      "- Right 25%: PRODUCT hero shot\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + product) max 65%, white space min 35%",
    typography: "high-contrast serif (Didot/Bodoni) + delicate sans",
    palette: ["#FAF7F3 (pearl)", "#F4E4DD (blush)", "#2C2C2C", "#D4AF8C (gold accent)"],
    imageStyle: "dewy beauty close-up, water droplets, glossy texture, ingredient highlights",
    mood: "clean luxurious, dewy, scientifically pure, magazine beauty editorial",
    examples: "Glossier·Aesop·La Mer·설화수 톤",
    compliance: "주름 제거/기미 제거/재생 사용 금지 (화장품법)",
  },
  "화장품": {
    framework: "high-involvement emotional + hedonic",
    academicRef: "hedonic + abstract 매칭 + Bakhshi face +38%",
    paletteRationale:
      "Bottomley & Doyle (2006): sensory-social 카테고리, warm pastel. " +
      "Hagtvedt & Brakus (2009): 저채도→luxury. " +
      "Labrecque & Milne (2012): 분홍/gold=sincerity/prestige.",
    expressionGuide:
      "Wang 2017 + Peace 2006: 약한 Duchenne smile, serene 분위기.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred natural light window / soft pastel ingredient setting. " +
      "Pearl/blush 유지.",
    faceProportion:
      "Archer 1983: face=hero, close-up 30~45%.",
    modelPersona: "fresh dewy or mature elegant beauty close-up",
    appeal: "emotional + sensorial",
    expression: "abstract",
    layout:
      "BEAUTY DUAL PANEL (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center-left 45%: MODEL face close-up\n" +
      "- Right 25%: PRODUCT hero\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 65% of frame",
    typography: "high-contrast serif + delicate sans",
    palette: ["#FAF7F3", "#F4E4DD", "#2C2C2C", "#D4AF8C"],
    imageStyle: "dewy beauty, glossy texture, ingredient highlights",
    mood: "clean luxurious, dewy",
    examples: "Glossier·설화수 톤",
    compliance: "주름 제거/기미 제거/재생 사용 금지 (화장품법)",
  },
  "문화·예술·디자인·방송": {
    framework: "high-involvement emotional",
    academicRef: "매력성·세련됨",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 채도 대비(주류 muted + vivid 액센트)=incongruity → 'creative' 지각. " +
      "Labrecque & Milne (2012): vivid 액센트=excitement·기억점 강화.",
    expressionGuide:
      "Peace 2006: 표현적 thoughtful expression 가능 — 직시 + subtle smile or contemplative neutral. " +
      "장르에 따라 expressive 허용.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred gallery wall / studio with art element / creative space.",
    faceProportion:
      "Sundar 2008 medium with creative element. " +
      "Face 20~30%.",
    modelPersona: "creative sophisticated 20~40s, artist persona",
    appeal: "emotional + creative",
    expression: "metaphorical, artistic",
    layout:
      "EXPERIMENTAL ASYMMETRIC (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Off-center 50%: MODEL artist with creative element (50% of frame)\n" +
      "- Background: artistic context (gallery/studio/stage)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "expressive type mix (display serif + grotesque)",
    palette: ["#F4F1EA", "#1A1A1A", "#FF4500 (vivid accent)"],
    imageStyle: "editorial artistic, unconventional cropping, color play",
    mood: "creative, sophisticated, artistic",
    examples: "갤러리·문화공간·예술축제 톤",
  },

  // ════════════════════════════════════════════════════════
  // 저관여 + 이성 (친근·신뢰 — F-pattern with model)
  // ════════════════════════════════════════════════════════
  "교육·학원": {
    framework: "low-involvement rational",
    academicRef: "친근·신뢰 결합 + Bakhshi face +38%",
    paletteRationale:
      "Mehta & Zhu (2009): 따뜻한 톤=focus/attention 강화 (학습 환경). " +
      "Labrecque & Milne (2012): 노랑/오렌지=sincerity·ruggedness, 친근감 형성. " +
      "Bagchi & Cheema (2013): orange=action(achievement) 신호.",
    expressionGuide:
      "Peace 2006 warm Duchenne smile → caring teacher 인상. " +
      "Wang 2017: 약~중간 강도가 친근감·신뢰 균형.",
    backgroundContext:
      "Mandel & Johnson 2002 priming: blurred classroom / library / warm study space. " +
      "Warm cream 톤.",
    faceProportion:
      "Sundar 2008 medium engagement. " +
      "Face 22~30%.",
    modelPersona: "approachable trustworthy teacher 30~40s with student",
    appeal: "rational + warm",
    expression: "direct (results, testimonials)",
    layout:
      "F-PATTERN WITH MODEL (얼굴 포함):\n" +
      "- Top horizontal 25%: BLANK for headline overlay\n" +
      "- Left 35%: MODEL teacher portrait (35% of frame)\n" +
      "- Right 35%: classroom context / student\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "rounded sans-serif (Pretendard Medium) + bold accent",
    palette: ["#FFF8E7 (warm cream)", "#1A1A1A", "#FF6B35 (achievement orange)"],
    imageStyle: "warm classroom or studio, smiling teacher, achievement vibes",
    mood: "trustworthy, approachable, achievement-oriented",
    examples: "메가스터디·이투스·강남대성 톤",
  },
  "사회복지·종교": {
    framework: "low-involvement rational + warm",
    academicRef: "편안함·친근함 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 노랑/갈=sincerity, 초록=peace. " +
      "Mehta & Zhu (2009): warm earth tones=community/warmth 연상. " +
      "Bottomley & Doyle (2006): 비영리=sensory-social, warm 권장.",
    expressionGuide:
      "Peace 2006: warm authentic Duchenne smile (눈 주름). " +
      "진정성 perception 핵심.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred community center / warm hall / candid documentary setting.",
    faceProportion:
      "Sundar 2008 medium with warmth. " +
      "Face 25~32%.",
    modelPersona: "warm comforting all ages, caregiver or community member",
    appeal: "emotional + community",
    expression: "narrative, testimonial",
    layout:
      "WARM CENTERED (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 55%: MODEL warm portrait or candid moment (55% of frame)\n" +
      "- Bottom-center 20%: BLANK for CTA overlay\n" +
      "- Subject max 60% of frame\n" +
      "- Soft natural composition",
    typography: "humanist sans + script accent",
    palette: ["#FAF3E7", "#3E2723", "#88B04B (warm green)"],
    imageStyle: "candid documentary, warm lighting, real moments",
    mood: "warm, comforting, community-driven",
    examples: "사회복지·종교단체 톤",
  },

  // ════════════════════════════════════════════════════════
  // 저관여 + 감성 (친근·활발 — Z-pattern with model)
  // ════════════════════════════════════════════════════════
  "음식서비스": {
    framework: "low-involvement emotional",
    academicRef: "감성·식음료 친근함 + Bakhshi face +38%",
    paletteRationale:
      "Singh (2006): 따뜻한 톤(빨강·노랑·갈)=식욕 자극 (식음료 광고 기본). " +
      "Mehta & Zhu (2009): 빨강=주의 환기, 따뜻함=appetite 활성화. " +
      "Bottomley & Doyle (2006): 식음료=sensory-social, warm earth 권장.",
    expressionGuide:
      "Peace 2006 + Wang 2017: warm Duchenne smile (open-mouth 가능) — appetite + warmth 함께.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred restaurant kitchen / dining area / warm golden hour. " +
      "Cream·caramel 유지.",
    faceProportion:
      "Sundar 2008: food=hero, model=context. " +
      "Medium with food, face 18~24%.",
    modelPersona: "friendly approachable chef/server 20~40s with food",
    appeal: "emotional + sensorial",
    expression: "appetizing visual",
    layout:
      "Z-PATTERN MODEL + FOOD (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 40%: MODEL serving or holding food\n" +
      "- Right 25%: featured dish close-up\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + food) max 60% of frame",
    typography: "rounded sans + handwriting script (캘리그라피)",
    palette: ["#FAF3E7 (cream)", "#3E2723 (espresso)", "#C68642 (caramel)"],
    imageStyle: "warm cozy lifestyle, food prominent with model serving, golden hour",
    mood: "inviting, artisanal, comforting",
    examples: "Blue Bottle·Stumptown·동네식당 톤",
    compliance: "치료/예방/건강에 좋다 사용 금지 (식품위생법)",
  },
  "카페·커피숍": {
    framework: "low-involvement emotional",
    academicRef: "친근함·감성 + Bakhshi face +38%",
    paletteRationale:
      "Singh (2006): 따뜻한 cream/caramel=appetite + comfort. " +
      "Labrecque & Milne (2012): 갈색=ruggedness/sincerity, 카페 lifestyle 정체성. " +
      "Mehta & Zhu (2009): warm tones=focus(독서·작업 환경).",
    expressionGuide:
      "Peace 2006 warm Duchenne smile (눈 주름) — 친근함·따뜻함 lifestyle.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred warm cafe interior with bokeh window light / wooden surface.",
    faceProportion:
      "Sundar 2008 lifestyle moment. " +
      "Medium with cup, face 18~24%.",
    modelPersona: "friendly warm 20~30s holding coffee cup, gentle smile",
    appeal: "emotional",
    expression: "lifestyle moment",
    layout:
      "Z-PATTERN CAFE LIFESTYLE (얼굴 포함):\n" +
      "- Top-left 30%: BLANK for headline overlay\n" +
      "- Center 40%: MODEL holding coffee, casual cafe vibe (40% of frame)\n" +
      "- Right 25%: cafe interior context (subtle)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "handwriting script + rounded sans",
    palette: ["#FAF3E7", "#3E2723", "#C68642"],
    imageStyle: "warm cafe interior, ceramic cup, model with warm smile, golden hour",
    mood: "inviting, artisanal, third-wave coffee",
    examples: "Blue Bottle·Onibus·도담카페 톤",
  },
  "주류": {
    framework: "low-involvement emotional + hedonic",
    academicRef: "주류=저관여+감성, 활발함 + Bakhshi face",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 검정+gold=hedonic premium. " +
      "Labrecque & Milne (2012): 빨강(wine)=excitement·passion, gold=sophistication. " +
      "Bottomley & Doyle (2006): 주류=sensory-social hedonic, warm/dark 조합.",
    expressionGuide:
      "Peace 2006: hedonic confident smile 또는 사회적 toasting 미소. " +
      "Wang 2017: 약~중 강도가 social·premium 균형.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred moody bar with bokeh / dim warm lighting. " +
      "검정·gold·wine 유지.",
    faceProportion:
      "Sundar 2008 mood with drink. " +
      "Face 20~28%.",
    modelPersona: "energetic sociable 20~30s in social drinking moment",
    appeal: "emotional + social",
    expression: "abstract (mood, party, atmosphere)",
    layout:
      "MOODY GROUP MOMENT (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: MODEL toasting/holding drink (50% of frame)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 60% of frame\n" +
      "- Moody bar atmosphere with bokeh",
    typography: "bold display sans + accent script",
    palette: ["#1A1A1A", "#D4AF37 (gold)", "#8B0000 (wine red)"],
    imageStyle: "moody dim lighting, bokeh, golden tones, model with drink",
    mood: "celebratory, social, sophisticated drink",
    examples: "참이슬·하이트·맥주 광고 톤",
  },
  "이용·숙박·여행·오락·스포츠": {
    framework: "low-involvement emotional",
    academicRef: "활발·친근 + Bakhshi face engagement",
    paletteRationale:
      "Bagchi & Cheema (2013): orange/yellow=action·urgency, 여행 부킹 행동 자극. " +
      "Mehta & Zhu (2009): 따뜻한 톤=energy/aspiration. " +
      "Labrecque & Milne (2012): 노랑=sincerity·excitement.",
    expressionGuide:
      "Peace 2006 + Wang 2017: energetic open Duchenne smile — 활기·aspiration 직접 노출.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred destination scenery / scenic landscape / sun-drenched setting.",
    faceProportion:
      "Sundar 2008 wide with destination = aspirational lifestyle. " +
      "Face 12~18%.",
    modelPersona: "energetic active 20~40s in destination context",
    appeal: "emotional + aspirational",
    expression: "lifestyle moments, scenery",
    layout:
      "WIDE LANDSCAPE WITH MODEL (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: MODEL in destination/activity (40% of frame)\n" +
      "- Background 30%: scenic environment\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 50% of frame",
    typography: "bold sans + script accent",
    palette: ["#FFFFFF", "#1A1A1A", "#FFB347 (sunny accent)"],
    imageStyle: "outdoor lifestyle, vibrant scenery, action moments with model",
    mood: "energetic, aspirational, vibrant",
    examples: "야놀자·여기어때·스포츠 브랜드 톤",
  },
  "헬스·스포츠": {
    framework: "high-involvement emotional",
    academicRef: "활발·전문성 결합 + Bakhshi face +38%",
    paletteRationale:
      "Bagchi & Cheema (2013): 빨강=action/urgency, 운동 동기 자극. " +
      "Mehta & Zhu (2009): 빨강=detail focus(자세·기록 중심). " +
      "Hagtvedt & Brakus (2009): 검정+빨강=premium fitness.",
    expressionGuide:
      "Peace 2006: determined confident expression — 강한 미소보다 focus·intensity. " +
      "Essiz 2025: premium fitness = neutral·intense.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred gym or outdoor athletic field / dynamic environment.",
    faceProportion:
      "Sundar 2008 dynamic action. " +
      "Face 18~24% (motion·body 강조).",
    modelPersona: "athletic energetic 20~30s in motion",
    appeal: "emotional + performance",
    expression: "direct (results) + abstract (motivation)",
    layout:
      "DYNAMIC ACTION (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 55%: MODEL in athletic motion or pose (55% of frame)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 60% of frame\n" +
      "- Dramatic lighting, motion energy",
    typography: "bold condensed sans (Bebas) + accent",
    palette: ["#1A1A1A", "#FFFFFF", "#FF3B30 (energy red)"],
    imageStyle: "athletic action, gym or outdoor, dramatic lighting",
    mood: "energetic, motivational, premium fitness",
    examples: "나이키·아디다스·체육관 톤",
  },

  // ════════════════════════════════════════════════════════
  // 소상공인 세부 업종
  // ════════════════════════════════════════════════════════
  "병원": {
    framework: "high-involvement rational + warm",
    academicRef: "전문성+편안함 + Bakhshi face +38%",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑/초록=trust/health 일관. " +
      "Aslam (2006): 한국 흰색=청결, 의료 표준. " +
      "Bottomley & Doyle (2006): 의료=functional·trust, blue/white 권장.",
    expressionGuide:
      "Peace 2006 reassuring soft Duchenne smile (warm + competent 균형). " +
      "Essiz 2025: 의료 = trust > excitement, 강한 미소는 역효과.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred clinical white or warm patient room / soft natural light.",
    faceProportion:
      "Trustworthy 3/4 portrait, face 25~32%.",
    modelPersona: "trustworthy doctor 30~40s in white coat, gentle smile",
    appeal: "rational + reassuring",
    expression: "direct + warm",
    layout:
      "CENTERED MEDICAL (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 50%: DOCTOR/MEDICAL STAFF frontal (45% of frame)\n" +
      "- Background: clinical white or light cyan\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 50% of frame\n" +
      "- Soft rounded composition, lots of breathing room",
    typography: "humanist sans-serif Pretendard",
    palette: ["#E8F4F8", "#FFFFFF", "#2A7F62"],
    imageStyle: "soft natural light, gentle smile, clean clinical",
    mood: "reassuring, trustworthy, hygienic",
    examples: "강남세브란스·삼성서울 톤",
    compliance: "최고/완치/효과100%/신의손 사용 금지 (의료법)",
  },
  "미용실·살롱": {
    framework: "high-involvement emotional",
    academicRef: "매력성 (헤어 효과 = 얼굴 필수) + Bakhshi face +38%",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 저채도→premium·sophistication (sand→charcoal로 교체해 워밍 드리프트 차단). " +
      "Labrecque & Milne (2012): 검정/charcoal=sophistication. " +
      "Bottomley & Doyle (2006): 미용=sensory-social, but premium 살롱은 muted neutral.",
    expressionGuide:
      "Essiz 2025 럭셔리 살롱: editorial neutral 또는 약한 confident closed-mouth. " +
      "Wang 2017: 약한 미소.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred chic salon backdrop / minimal mirror reflection / studio.",
    faceProportion:
      "Archer 1983: 헤어 효과 강조 → 얼굴 close-up·portrait beauty. " +
      "Face 30~40% (hair=hero).",
    modelPersona: "sophisticated stylish 20~40s with elegant haircut",
    appeal: "emotional + transformation",
    expression: "before-after, lifestyle",
    layout:
      "PORTRAIT BEAUTY (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 55%: MODEL beauty close-up showing hair (55% of frame)\n" +
      "- Background: salon backdrop or studio\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 60% of frame",
    typography: "modern serif + elegant sans",
    palette: ["#F5F0E6 (cream)", "#1A1A1A", "#3E3E3E (charcoal accent)"],
    imageStyle: "salon photography, dramatic side light, hair texture",
    mood: "sophisticated, transformative, premium",
    examples: "준오헤어·박승철·압구정살롱 톤",
  },
  "꽃집": {
    framework: "high-involvement emotional + hedonic",
    academicRef: "감성·심미 + Bakhshi face +38%",
    paletteRationale:
      "Labrecque & Milne (2012): 분홍=warmth/sincerity, 초록=peace/nature. " +
      "Bottomley & Doyle (2006): 꽃=sensory-social, soft pastel 권장. " +
      "Hagtvedt & Brakus (2009): 저채도 pastel=premium 플로리스트 톤.",
    expressionGuide:
      "Peace 2006 gentle warm smile — 부드러움·romance.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred botanical interior with flowers / soft natural light / petals texture.",
    faceProportion:
      "Sundar 2008 medium with botanical detail. " +
      "Face 22~28%.",
    modelPersona: "warm gentle 20~40s florist or customer holding flowers",
    appeal: "emotional + sensory",
    expression: "abstract beauty",
    layout:
      "MODEL-CENTRIC BOTANICAL (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 45%: MODEL holding flower bouquet (40% of frame)\n" +
      "- Right 30%: flower arrangement / botanical context\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + flowers) max 65% of frame",
    typography: "elegant script + delicate sans",
    palette: ["#FAF3E7", "#F4E4DD", "#88B04B (foliage green)"],
    imageStyle: "soft natural light, model with botanical detail, dewy petals",
    mood: "romantic, soft, artistic",
    examples: "꽃집·웨딩 플로리스트 톤",
  },
  "부동산": {
    framework: "high-involvement rational",
    academicRef: "부동산=고관여+이성 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): navy=competence, gold=prestige. " +
      "Hagtvedt & Brakus (2009): 저채도+gold=premium 부동산 표준. " +
      "Aslam (2006): 한국 gold=권위/안정.",
    expressionGuide:
      "Essiz 2025 + Peace 2006: trustworthy neutral with 약한 confident closed-mouth. " +
      "Premium 부동산 = competence·credibility 우선.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred premium apartment exterior / modern lobby / architectural detail.",
    faceProportion:
      "Sundar 2008 medium with property. " +
      "Face 18~25%.",
    modelPersona: "trustworthy realtor 40~50s in suit at property",
    appeal: "rational + aspiration",
    expression: "direct (specs, location)",
    layout:
      "F-PATTERN WITH PROPERTY (얼굴 포함):\n" +
      "- Top horizontal 25%: BLANK for headline overlay\n" +
      "- Left 35%: REALTOR portrait (35% of frame)\n" +
      "- Right 35%: property exterior/interior\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (realtor + property) max 60% of frame",
    typography: "modern sans Pretendard SemiBold",
    palette: ["#0A2540", "#FFFFFF", "#C9A227 (premium gold)"],
    imageStyle: "architectural photography, golden hour exterior, professional realtor",
    mood: "premium, trustworthy, aspirational",
    examples: "프리미엄 아파트·오피스텔 광고 톤",
  },
  "자동차정비": {
    framework: "low-involvement rational",
    academicRef: "신뢰·친근·전문 + Bakhshi face engagement",
    paletteRationale:
      "Mehta & Zhu (2009): 오렌지=주의/action, 정비 신호. " +
      "Bagchi & Cheema (2013): orange=urgency 표시. " +
      "Labrecque & Milne (2012): 검정=ruggedness/dependable.",
    expressionGuide:
      "Peace 2006 dependable warm Duchenne smile — 친근·신뢰 동시.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred workshop with tools / garage interior / hands-on activity.",
    faceProportion:
      "Sundar 2008 medium workshop. " +
      "Face 22~28%.",
    modelPersona: "competent friendly mechanic 30~40s in workshop",
    appeal: "rational + trust",
    expression: "direct (capability)",
    layout:
      "WORKSHOP COMPOSITION (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: MECHANIC at work (45% of frame)\n" +
      "- Right 25%: tool/vehicle context\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "industrial sans + bold",
    palette: ["#1A1A1A", "#FFFFFF", "#FF6B35 (mechanic orange)"],
    imageStyle: "garage workshop, hands-on action, mechanic portrait",
    mood: "trustworthy, professional, dependable",
    examples: "동네 정비소·정비센터 톤",
  },

  // ════════════════════════════════════════════════════════
  // NCS 추가 대분류 (B2B 산업재)
  // ════════════════════════════════════════════════════════
  "사업관리·경영·회계·사무": {
    framework: "high-involvement rational",
    academicRef: "전문성·신뢰감 + Bakhshi face +38%",
    paletteRationale:
      "Labrecque & Milne (2012): navy/blue=competence/trust. " +
      "Bottomley & Doyle (2006): B2B 컨설팅=functional, blue/black 권장. " +
      "Hagtvedt & Brakus (2009): 저채도=premium B2B.",
    expressionGuide:
      "Essiz 2025 B2B competence: professional neutral 또는 약한 confident closed-mouth.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred modern office / boardroom / data viz wall.",
    faceProportion:
      "Trustworthy 3/4, face 25~32% — Archer 1983 authority perception.",
    modelPersona: "professional executive 30~40s in office attire",
    appeal: "rational",
    expression: "direct (efficiency, ROI)",
    layout:
      "CORPORATE F-PATTERN (얼굴 포함):\n" +
      "- Top horizontal 25%: BLANK for headline overlay\n" +
      "- Left 40%: EXECUTIVE portrait (40% of frame)\n" +
      "- Right 25%: data viz / clean infographic\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 50% of frame",
    typography: "geometric sans-serif (Pretendard SemiBold) + monospace data",
    palette: ["#0A2540", "#FFFFFF", "#0066FF"],
    imageStyle: "modern office, professional attire, clean studio",
    mood: "trustworthy, efficient, premium B2B",
    examples: "삼성SDS·LG CNS 톤",
  },
  "건설": {
    framework: "high-involvement rational",
    academicRef: "전문성·신뢰감 + Bakhshi face engagement",
    paletteRationale:
      "Mehta & Zhu (2009): 노랑(safety)=주의 환기, 작업 표준. " +
      "Labrecque & Milne (2012): 검정=ruggedness/power. " +
      "Aslam (2006): 한국 노랑(안전모)=신뢰·표준.",
    expressionGuide:
      "Peace 2006: trustworthy confident — 약한 Duchenne 또는 dependable neutral.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred construction site / architectural scale / safety site.",
    faceProportion:
      "Sundar 2008 wide with site/scale. " +
      "Face 15~22%.",
    modelPersona: "rugged competent foreman 30~50s in safety gear",
    appeal: "rational + reliability",
    expression: "direct (capability, scale)",
    layout:
      "WIDE ARCHITECTURAL WITH MODEL (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Left 30%: FOREMAN portrait\n" +
      "- Right 45%: construction site / scale demonstration\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + site) max 65% of frame",
    typography: "industrial sans-serif (Bebas/Anton) + clean body",
    palette: ["#1A1A1A", "#FFC107 (safety yellow)", "#FFFFFF"],
    imageStyle: "construction site, dramatic scale, foreman portrait + golden hour",
    mood: "powerful, trustworthy, established",
    examples: "현대건설·삼성물산 톤",
  },
  "기계·재료·전기·전자": {
    framework: "high-involvement rational",
    academicRef: "스펙·기능 강조 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑=competence + 정밀. " +
      "Bottomley & Doyle (2006): 산업재 functional=blue/black. " +
      "Hagtvedt & Brakus (2009): 저채도 industrial=precision 신뢰.",
    expressionGuide:
      "Essiz 2025 industrial precision: confident neutral.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred factory floor / industrial setting / precision equipment.",
    faceProportion:
      "Sundar 2008 medium with product. " +
      "Face 20~26%.",
    modelPersona: "engineer technical 30~40s with product",
    appeal: "rational",
    expression: "direct (specs, performance)",
    layout:
      "PRODUCT-CENTRIC WITH ENGINEER (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: ENGINEER inspecting product (45% of frame)\n" +
      "- Right 25%: technical spec accents\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (engineer + product) max 60%",
    typography: "technical sans (Pretendard Medium) + monospace specs",
    palette: ["#1A1A1A", "#FFFFFF", "#00A0E9 (industrial blue)"],
    imageStyle: "factory or studio, engineer with product, precise lighting",
    mood: "precise, capable, advanced engineering",
    examples: "두산·현대로보틱스 톤",
  },
  "화학·바이오": {
    framework: "high-involvement rational",
    academicRef: "전문성·과학적 신뢰 + Bakhshi face +38%",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑=competence + scientific trust. " +
      "Aslam (2006): 한국 흰색=sterile/연구 표준. " +
      "Bottomley & Doyle (2006): 과학·바이오=functional, white/blue 표준.",
    expressionGuide:
      "Essiz 2025 scientific competence: neutral focused expression.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred lab setting / clean equipment / molecular accents.",
    faceProportion:
      "Trustworthy medium, face 22~28%.",
    modelPersona: "scientist researcher 30~40s in lab coat",
    appeal: "rational + scientific",
    expression: "direct (research, efficacy)",
    layout:
      "LAB-CLEAN WITH SCIENTIST (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: SCIENTIST at work (45% of frame)\n" +
      "- Right 25%: molecular/research accent\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "scientific sans + serif emphasis",
    palette: ["#FFFFFF", "#0096C7 (lab blue)", "#0A2540"],
    imageStyle: "lab environment, scientist with equipment, sterile clean",
    mood: "scientific, trustworthy, breakthrough",
    examples: "셀트리온·삼성바이오 톤",
  },
  "환경·에너지·안전": {
    framework: "high-involvement rational + warm",
    academicRef: "신뢰성·미래지향 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 초록=ruggedness/peace + sustainability 연상. " +
      "Aslam (2006): 한국 초록=자연/건강. " +
      "Hagtvedt & Brakus (2009): muted 초록=premium ESG.",
    expressionGuide:
      "Peace 2006: optimistic warm smile — sustainability·미래지향 긍정.",
    backgroundContext:
      "Mandel & Johnson 2002 + Aslam 한국: blurred natural setting with green elements / outdoor eco.",
    faceProportion:
      "Sundar 2008 medium with eco. " +
      "Face 22~28%.",
    modelPersona: "responsible competent 30~40s in eco-context",
    appeal: "rational + ethical",
    expression: "direct + visionary",
    layout:
      "NATURE-INTEGRATED (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: MODEL in eco/green setting (45% of frame)\n" +
      "- Right 25%: sustainability symbols\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "humanist sans + accent script",
    palette: ["#88B04B (eco green)", "#FFFFFF", "#1A4D2E"],
    imageStyle: "natural light, green elements, model with clean architecture",
    mood: "trustworthy, future-forward, sustainable",
    examples: "한화·SK이노베이션 ESG 톤",
  },
  "인쇄·목재·가구·공예": {
    framework: "high-involvement emotional + hedonic",
    academicRef: "공예·심미 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 노랑/갈=sincerity·craftsmanship. " +
      "Bottomley & Doyle (2006): 공예=sensory-social, warm wood/paper. " +
      "Hagtvedt & Brakus (2009): muted earth=artisanal premium.",
    expressionGuide:
      "Peace 2006: thoughtful artisan smile — 진정성·craftsmanship.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred warm workshop / material textures / wood paper backdrop.",
    faceProportion:
      "Sundar 2008 medium hands-on. " +
      "Face 20~26%.",
    modelPersona: "artisan thoughtful 30~50s in workshop",
    appeal: "emotional + craftsmanship",
    expression: "abstract (texture, detail)",
    layout:
      "WARM WORKSHOP (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 45%: ARTISAN at work, hands on craft (45% of frame)\n" +
      "- Right 25%: product detail close-up\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (artisan + product) max 60%",
    typography: "old-style serif + handcraft script",
    palette: ["#F5EDE0 (paper)", "#3E2723", "#A0522D (wood)"],
    imageStyle: "warm workshop lighting, hands at work, material texture, artisan portrait",
    mood: "artisanal, warm, crafted",
    examples: "한샘·이케아 + 공방 톤",
  },
  "운전·운송·물류": {
    framework: "low-involvement rational",
    academicRef: "신뢰·효율 + Bakhshi face engagement",
    paletteRationale:
      "Bagchi & Cheema (2013): orange=urgency/delivery action. " +
      "Mehta & Zhu (2009): 빨강·오렌지=주의/속도. " +
      "Labrecque & Milne (2012): 검정+orange=dependable + active.",
    expressionGuide:
      "Peace 2006 dependable confident — 약한 closed-mouth smile 또는 neutral.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred urban street with vehicle / dawn delivery / route context.",
    faceProportion:
      "Sundar 2008 medium with vehicle. " +
      "Face 22~28%.",
    modelPersona: "dependable approachable driver/courier 30~40s in uniform",
    appeal: "rational + speed",
    expression: "direct (delivery, time)",
    layout:
      "URBAN WITH DRIVER (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: DRIVER/COURIER portrait (45% of frame)\n" +
      "- Right 25%: vehicle/route context\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "bold condensed sans (Bebas) + clean body",
    palette: ["#1A1A1A", "#FFFFFF", "#FF6B35 (delivery orange)"],
    imageStyle: "urban street, driver portrait + vehicle, dawn delivery",
    mood: "fast, reliable, urban",
    examples: "쿠팡로지스틱스·CJ대한통운 톤",
  },
  "경비·청소·시설관리": {
    framework: "low-involvement rational",
    academicRef: "신뢰·청결 + Bakhshi face engagement",
    paletteRationale:
      "Aslam (2006): 한국 흰색=청결 표준. " +
      "Labrecque & Milne (2012): 파랑=trust, navy=competence. " +
      "Bottomley & Doyle (2006): 시설 서비스=functional, white/blue.",
    expressionGuide:
      "Peace 2006 friendly trustworthy — 부드러운 Duchenne smile (warm + reliable).",
    backgroundContext:
      "Mandel & Johnson 2002: blurred spotless interior / clean facility / dawn light.",
    faceProportion:
      "Sundar 2008 medium portrait. " +
      "Face 25~30%.",
    modelPersona: "attentive professional 30~50s in uniform",
    appeal: "rational + reliability",
    expression: "direct (cleanliness, security)",
    layout:
      "CLEAN SPACE WITH STAFF (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: STAFF portrait in spotless setting (45% of frame)\n" +
      "- Right 25%: clean space context\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "clean sans-serif Pretendard",
    palette: ["#FFFFFF", "#E0F4F1", "#0A2540"],
    imageStyle: "spotless interior, dawn light, professional uniform staff portrait",
    mood: "trustworthy, hygienic, dependable",
    examples: "에스원·청소업체 톤",
  },
  "농림어업·식품": {
    framework: "low-involvement emotional + warm",
    academicRef: "친근·자연·신뢰 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 노랑/갈=sincerity, 초록=ruggedness/nature. " +
      "Bottomley & Doyle (2006): 식품·농산=sensory-social, warm earth + green. " +
      "Mehta & Zhu (2009): warm tones=appetite + authenticity.",
    expressionGuide:
      "Peace 2006 warm authentic smile — 진정성·farm-to-table 신뢰.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred farm / golden hour field / harvest setting.",
    faceProportion:
      "Sundar 2008 medium with produce. " +
      "Face 22~28%.",
    modelPersona: "earthy genuine farmer/producer 40~60s in farm setting",
    appeal: "emotional + authenticity",
    expression: "narrative + lifestyle",
    layout:
      "FARM-TO-TABLE (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: PRODUCER holding produce (45% of frame)\n" +
      "- Right 25%: harvest/farm context\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (producer + produce) max 60% of frame",
    typography: "humanist serif + script accent",
    palette: ["#FAF3E7", "#3E2723", "#88B04B"],
    imageStyle: "golden hour farm, warm earth tones, real producer portrait",
    mood: "authentic, warm, farm-to-table",
    examples: "정관장·농협 식품 톤",
  },
  "영업판매·유통": {
    framework: "low-involvement emotional",
    academicRef: "친근·활발 + Bakhshi face +38%",
    paletteRationale:
      "Bagchi & Cheema (2013): 빨강=urgency, 가격 행동 자극(SALE 표현). " +
      "Mehta & Zhu (2009): 빨강·노랑=detail focus(가격표·할인표). " +
      "Singh (2006): 빨강·노랑=충동구매 자극 첫 90초.",
    expressionGuide:
      "Wang 2017 + Peace 2006: lively friendly smile — 친근·활발 (open Duchenne 가능).",
    backgroundContext:
      "Mandel & Johnson 2002: blurred bright retail aisle / abundant product display.",
    faceProportion:
      "Sundar 2008 medium with products. " +
      "Face 22~28%.",
    modelPersona: "energetic friendly staff 20~40s in retail",
    appeal: "emotional + bargain",
    expression: "direct + lively",
    layout:
      "VIBRANT RETAIL WITH STAFF (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: STAFF/MODEL with products (45% of frame)\n" +
      "- Right 25%: product callouts\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + products) max 60%",
    typography: "bold display sans + accent badge",
    palette: ["#FFFFFF", "#FF3B30 (sale red)", "#FFD700"],
    imageStyle: "bright retail energy, smiling staff portrait, abundance",
    mood: "lively, abundant, value",
    examples: "이마트·롯데마트 광고 톤",
  },
  "법무사·세무사·전문서비스": {
    framework: "high-involvement rational",
    academicRef: "전문성·신뢰성 + Bakhshi face +38%",
    paletteRationale:
      "Hagtvedt & Brakus (2009): 저채도 검정=authority + premium. " +
      "Labrecque & Milne (2012): 검정=sophistication, gold=prestige. " +
      "Aslam (2006): 한국 gold=전문가 위상.",
    expressionGuide:
      "Essiz 2025 전문직 authority: authoritative neutral / 약한 confident closed-mouth.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred formal office / dignified interior / document setting.",
    faceProportion:
      "Archer 1983 high face-ism → authority. " +
      "Portrait 3/4, face 28~35%.",
    modelPersona: "authoritative confident 40~60s in formal suit",
    appeal: "rational",
    expression: "direct (expertise, results)",
    layout:
      "AUTHORITY CENTERED (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 55%: PROFESSIONAL frontal portrait (50% of frame)\n" +
      "- Bottom-center 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame\n" +
      "- Monolithic typography hierarchy",
    typography: "serif display + modern sans body",
    palette: ["#1A1A1A", "#FFFFFF", "#8B6914"],
    imageStyle: "office setting, suit, dignified portrait",
    mood: "authoritative, established",
    examples: "법무법인·세무법인 톤",
  },
  "빵집·디저트": {
    framework: "low-involvement emotional + hedonic",
    academicRef: "감각적·달콤한 어필 + Bakhshi face engagement",
    paletteRationale:
      "Bottomley & Doyle (2006): 디저트=sensory-social hedonic, warm pastel. " +
      "Singh (2006): warm 분홍·캐러멜=appetite + 달콤함 연상. " +
      "Mehta & Zhu (2009): warm tones=식욕·따뜻함.",
    expressionGuide:
      "Peace 2006 + Wang 2017: warm sweet Duchenne smile — 따뜻함·indulgence.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred warm bakery with pastries / golden bakery light / steam.",
    faceProportion:
      "Sundar 2008 medium with pastry. " +
      "Face 20~26%.",
    modelPersona: "warm cheerful baker/customer 20~40s with pastries",
    appeal: "emotional + sensorial",
    expression: "abstract (texture, sweetness)",
    layout:
      "Z-PATTERN BAKERY (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 45%: MODEL with pastry/bread (40% of frame)\n" +
      "- Right 30%: featured pastry close-up\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject (model + pastry) max 60%",
    typography: "rounded sans + script accent",
    palette: ["#FAF3E7", "#C68642", "#E8B4A0"],
    imageStyle: "golden bakery light, fresh pastries close-up, model holding/serving, steam",
    mood: "warm, indulgent, artisan",
    examples: "파리바게뜨·뚜레쥬르 + 동네빵집 톤",
    compliance: "치료/예방/건강에 좋다 사용 금지 (식품위생법)",
  },
  "편의점·소형리테일": {
    framework: "low-involvement emotional",
    academicRef: "친근·접근성 + Bakhshi face +38%",
    paletteRationale:
      "Bagchi & Cheema (2013): 빨강·노랑=urgency/즉시 구매. " +
      "Singh (2006): 첫 90초 색상 결정—빨강·노랑=즉각성. " +
      "Mehta & Zhu (2009): 빨강·노랑=주의 환기 attention 광고.",
    expressionGuide:
      "Peace 2006: friendly approachable smile — daily relatability.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred bright store interior / casual everyday setting.",
    faceProportion:
      "Sundar 2008 medium relatable. " +
      "Face 22~28%.",
    modelPersona: "everyday relatable 20~30s in store setting",
    appeal: "emotional + convenience",
    expression: "direct + lively",
    layout:
      "VIBRANT STORE (얼굴 포함):\n" +
      "- Top-left 25%: BLANK for headline overlay\n" +
      "- Center 50%: MODEL/CUSTOMER with product (45% of frame)\n" +
      "- Right 25%: store interior context\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 55% of frame",
    typography: "bold rounded sans + accent",
    palette: ["#FFFFFF", "#FF3B30", "#FFC72C"],
    imageStyle: "bright store interior, casual moment, model with product",
    mood: "friendly, accessible, daily",
    examples: "GS25·CU·세븐일레븐 톤",
  },

  // ════════════════════════════════════════════════════════
  // 기본 폴백
  // ════════════════════════════════════════════════════════
  "기타": {
    framework: "balanced",
    academicRef: "친근+신뢰 균형 + Bakhshi face engagement",
    paletteRationale:
      "Labrecque & Milne (2012): 파랑=competence/trust 안전한 fallback. " +
      "Hagtvedt & Brakus (2009): 무채색+저채도 accent=neutral premium. " +
      "Bottomley & Doyle (2006): 일반 광고 fallback=blue/black/white.",
    expressionGuide:
      "Peace 2006: balanced warm neutral 또는 부드러운 closed-mouth smile — 안전한 fallback.",
    backgroundContext:
      "Mandel & Johnson 2002: blurred neutral professional setting / clean studio.",
    faceProportion:
      "Sundar 2008 medium balanced. " +
      "Face 25~30%.",
    modelPersona: "approachable warm 30~40s",
    appeal: "balanced",
    expression: "balanced",
    layout:
      "CENTERED HERO (얼굴 포함):\n" +
      "- Top-center 20%: BLANK for headline overlay\n" +
      "- Center 50%: MODEL portrait (45% of frame)\n" +
      "- Bottom-right 20%: BLANK for CTA overlay\n" +
      "- Subject max 50% of frame",
    typography: "Pretendard Regular + Bold accent",
    palette: ["#FAFAFA", "#1A1A1A", "#0066FF"],
    imageStyle: "natural photography, balanced lighting, professional portrait",
    mood: "approachable, professional",
    examples: "일반 광고",
  },
};

const FALLBACK_KEY = "기타";
const FALLBACK_CODE: DesignCode = INDUSTRY_DESIGN_CODE[FALLBACK_KEY] as DesignCode;

/**
 * 업종 → 디자인 코드 (정확 매칭 → 부분 매칭 → 폴백)
 */
export function getDesignCode(industry: string): DesignCode {
  const exact = INDUSTRY_DESIGN_CODE[industry];
  if (exact) return exact;
  for (const [key, code] of Object.entries(INDUSTRY_DESIGN_CODE)) {
    if (industry.includes(key) || key.includes(industry)) {
      return code;
    }
  }
  return FALLBACK_CODE;
}

export function listSupportedIndustries(): string[] {
  return Object.keys(INDUSTRY_DESIGN_CODE);
}
