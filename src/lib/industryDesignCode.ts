/**
 * 업종별 광고 디자인 코드 — v2 (zone-based + 모델 통일)
 *
 * AI 측 `ai/src/adgen/industry_design_code.py` 와 1:1 동기화.
 * Python 원본의 dict[str, dict]를 TS로 그대로 옮긴 형태.
 *
 * 학술 근거:
 * 1. Vaughn (1986) FCB Grid — 관여도 × 이성/감성
 * 2. Holbrook & Hirschman (1982) — Hedonic vs Utilitarian
 * 3. Pieters & Wedel (2004) JoM 68(2) — image size attention
 * 4. Bakhshi et al. (2014) CHI 2014 — face engagement +38%
 * 5. 한양대 광고 메타분석 175편 — 모델-제품 매칭 +24.8%
 */

export type DesignCode = {
  framework: string;
  academicRef: string;
  modelPersona: string;
  appeal: string;
  expression: string;
  layout: string;
  typography: string;
  palette: string[];
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
    palette: ["#F5F0E6 (cream)", "#1A1A1A", "#C4A57B (sand accent)"],
    imageStyle: "editorial fashion photography, dramatic side light, 3/4 angle, magazine quality",
    mood: "sophisticated, refined, aspirational, magazine editorial",
    examples: "Jacquemus·COS·Acne Studios 톤",
  },
  "옷가게": {
    framework: "high-involvement emotional",
    academicRef: "매력성 효과 극대화 (한양대 +24.8%)",
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
    palette: ["#F5F0E6", "#1A1A1A", "#C4A57B"],
    imageStyle: "editorial fashion, dramatic light, magazine quality",
    mood: "sophisticated, refined, editorial",
    examples: "Jacquemus·COS 톤",
  },
  "뷰티·화장품": {
    framework: "high-involvement emotional + hedonic",
    academicRef: "hedonic + abstract image 매칭 + Bakhshi face +38%",
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
    palette: ["#F5F0E6", "#1A1A1A", "#C4A57B"],
    imageStyle: "salon photography, dramatic side light, hair texture",
    mood: "sophisticated, transformative, premium",
    examples: "준오헤어·박승철·압구정살롱 톤",
  },
  "꽃집": {
    framework: "high-involvement emotional + hedonic",
    academicRef: "감성·심미 + Bakhshi face +38%",
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
