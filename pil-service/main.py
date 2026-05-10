"""Muse PIL Overlay Service v2 — GPT-vision spec + face-aware + 55 fonts + bg-block + hairline.

흐름:
  1) BE에서 base_url(생성된 광고 씬), industry, hero/sub/brand 카피 받음
  2) GPT-4o vision이 이미지 보고 typography spec JSON 생성 (font_id, position, size, etc.)
  3) PIL이 spec 받아 렌더 — face-detect 회피, pure 검정/흰색, bg-block underlay, hairline rule

레퍼런스 톤: Musinsa(패션) / Dior(뷰티) / Starbucks·Mega(카페) — pure color, no stroke, wide tracking
"""
import base64
import io
import json
import os
from pathlib import Path

import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont, ImageStat
from pydantic import BaseModel
import mediapipe as mp

app = FastAPI(title="Muse PIL Overlay Service v2")

FONT_DIR = Path(os.environ.get("FONT_DIR", "/fonts"))


# ─── Request / response ─────────────────────────────────────
class OverlayRequest(BaseModel):
    base_url: str
    # 신 — GPT-vision spec 생성용
    industry: str | None = None
    hero_text: str = ""
    sub_text: str | None = None
    brand_text: str | None = None
    # 구버전 호환 (BE가 점진 마이그레이션 가능)
    headline: str | None = None
    subhead: str | None = None
    headline_color: str | None = None
    subhead_color: str | None = None
    logo: str | None = None
    template: str = "instagram_square"


# ─── Font pool (55 fonts) ───────────────────────────────────
FONT_POOL: dict[str, str] = {}


def _f(name: str) -> str | None:
    p = FONT_DIR / name
    return str(p) if p.exists() else None


def _build_font_pool() -> None:
    candidates = {
        "playfair_display":   "PlayfairDisplay-VF.ttf",
        "cormorant_garamond": "CormorantGaramond-VF.ttf",
        "cinzel":             "Cinzel-VF.ttf",
        "abril_fatface":      "AbrilFatface-Regular.ttf",
        "dm_serif_display":   "DMSerifDisplay-Regular.ttf",
        "eb_garamond":        "EBGaramond-VF.ttf",
        "lora":               "Lora-VF.ttf",
        "crimson_text":       "CrimsonText-Regular.ttf",
        "inter":              "Inter-VF.ttf",
        "manrope":            "Manrope-VF.ttf",
        "dm_sans":            "DMSans-VF.ttf",
        "public_sans":        "PublicSans-VF.ttf",
        "work_sans":          "WorkSans-VF.ttf",
        "montserrat":         "Montserrat-VF.ttf",
        "poppins":            "Poppins-Regular.ttf",
        "poppins_bold":       "Poppins-Bold.ttf",
        "outfit":             "Outfit-VF.ttf",
        "plus_jakarta":       "PlusJakartaSans-VF.ttf",
        "bebas_neue":         "BebasNeue-Regular.ttf",
        "anton":              "Anton-Regular.ttf",
        "oswald":             "Oswald-VF.ttf",
        "big_shoulders":      "BigShouldersDisplay-VF.ttf",
        "six_caps":           "SixCaps-Regular.ttf",
        "archivo_black":      "ArchivoBlack-Regular.ttf",
        "black_ops_one":      "BlackOpsOne-Regular.ttf",
        "caveat":             "Caveat-VF.ttf",
        "pacifico":           "Pacifico-Regular.ttf",
        "dancing_script":     "DancingScript-VF.ttf",
        "shadows_into_light": "ShadowsIntoLight-Regular.ttf",
        "jetbrains_mono":     "JetBrainsMono-VF.ttf",
        "ibm_plex_mono":      "IBMPlexMono-Regular.ttf",
        "pretendard_light":   "Pretendard-Light.otf",
        "pretendard_regular": "Pretendard-Regular.otf",
        "pretendard_medium":  "Pretendard-Medium.otf",
        "pretendard_bold":    "Pretendard-Bold.otf",
        "pretendard_black":   "Pretendard-Black.otf",
        "gowun_batang_reg":   "GowunBatang-Regular.ttf",
        "gowun_batang_bold":  "GowunBatang-Bold.ttf",
        "hahmlet":            "Hahmlet-VF.ttf",
        "nanum_myeongjo":     "NanumMyeongjo-Bold.ttf",
        "nanum_myeongjo_xb":  "NanumMyeongjo-ExtraBold.ttf",
        "gowun_dodum":        "GowunDodum-Regular.ttf",
        "sunflower":          "Sunflower-Medium.ttf",
        "single_day":         "SingleDay-Regular.ttf",
        "black_han_sans":     "BlackHanSans-Regular.ttf",
        "do_hyeon":           "DoHyeon-Regular.ttf",
        "jua":                "Jua-Regular.ttf",
        "nanum_pen":          "NanumPenScript-Regular.ttf",
        "gaegu_bold":         "Gaegu-Bold.ttf",
        "gaegu_regular":      "Gaegu-Regular.ttf",
        "east_sea_dokdo":     "EastSeaDokdo-Regular.ttf",
        "cute_font":          "CuteFont-Regular.ttf",
        "yeon_sung":          "YeonSung-Regular.ttf",
        "stylish":            "Stylish-Regular.ttf",
    }
    for fid, fname in candidates.items():
        p = _f(fname)
        if p:
            FONT_POOL[fid] = p


_build_font_pool()


KR_FALLBACK = {
    "playfair_display": "nanum_myeongjo_xb", "cormorant_garamond": "nanum_myeongjo",
    "cinzel": "nanum_myeongjo_xb", "abril_fatface": "black_han_sans",
    "dm_serif_display": "gowun_batang_bold", "eb_garamond": "gowun_batang_reg",
    "lora": "gowun_batang_reg", "crimson_text": "nanum_myeongjo",
    "inter": "pretendard_regular", "manrope": "pretendard_regular",
    "dm_sans": "pretendard_regular", "public_sans": "pretendard_regular",
    "work_sans": "pretendard_medium", "montserrat": "pretendard_bold",
    "poppins": "pretendard_regular", "poppins_bold": "pretendard_bold",
    "outfit": "pretendard_medium", "plus_jakarta": "pretendard_medium",
    "bebas_neue": "black_han_sans", "anton": "black_han_sans",
    "oswald": "do_hyeon", "big_shoulders": "black_han_sans",
    "six_caps": "do_hyeon", "archivo_black": "pretendard_black",
    "black_ops_one": "black_han_sans", "caveat": "nanum_pen",
    "pacifico": "yeon_sung", "dancing_script": "nanum_pen",
    "shadows_into_light": "gaegu_regular", "jetbrains_mono": "pretendard_regular",
    "ibm_plex_mono": "pretendard_regular",
}


def has_korean(text: str) -> bool:
    return any('가' <= c <= '힣' for c in text)


# ─── Palette per industry (Musinsa/Dior/Starbucks tone) ────
PALETTE = {
    "패션·의류":   {"dark": "#0A0A0A", "light": "#FFFFFF", "accent": "#0A0A0A"},
    "뷰티·화장품": {"dark": "#0A0A0A", "light": "#FFFFFF", "accent": "#A88864"},
    "카페·커피숍": {"dark": "#0A0A0A", "light": "#FFFFFF", "accent": "#1F4332"},
    "기타":        {"dark": "#0A0A0A", "light": "#FFFFFF", "accent": "#0A0A0A"},
}


def palette_for(industry: str | None) -> dict:
    return PALETTE.get(industry or "기타", PALETTE["기타"])


# ─── color utils ──────────────────────────────────────────
def hex2rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = [c / 255 for c in rgb[:3]]
    def lin(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def contrast(a: float, b: float) -> float:
    a, b = max(a, b), min(a, b)
    return (a + 0.05) / (b + 0.05)


def sample_bg(img: Image.Image, x1, y1, x2, y2) -> tuple[int, int, int]:
    W, H = img.size
    box = (max(0, int(x1)), max(0, int(y1)), min(W, int(x2)), min(H, int(y2)))
    if box[2] <= box[0] or box[3] <= box[1]:
        return (128, 128, 128)
    sample = img.crop(box).convert("RGB")
    return tuple(int(v) for v in ImageStat.Stat(sample).mean)


def bg_variance(img: Image.Image, x1, y1, x2, y2) -> float:
    W, H = img.size
    box = (max(0, int(x1)), max(0, int(y1)), min(W, int(x2)), min(H, int(y2)))
    if box[2] <= box[0] or box[3] <= box[1]:
        return 0.0
    sample = img.crop(box).convert("L")
    stat = ImageStat.Stat(sample)
    return (stat.stddev[0] / 255.0) if stat.stddev else 0.0


def pure_color_for_bbox(img, bbox, palette, target="auto"):
    bg = sample_bg(img, *bbox)
    bg_lum = luminance(bg)
    very_busy = bg_variance(img, *bbox) > 0.18
    pdark = hex2rgb(palette["dark"])
    plight = hex2rgb(palette["light"])
    cd = contrast(luminance(pdark), bg_lum)
    cl = contrast(luminance(plight), bg_lum)
    if target == "dark":
        text_rgb, stroke_rgb, my = pdark, plight, cd
    elif target == "light":
        text_rgb, stroke_rgb, my = plight, pdark, cl
    else:
        if cd >= cl:
            text_rgb, stroke_rgb, my = pdark, plight, cd
        else:
            text_rgb, stroke_rgb, my = plight, pdark, cl
    needs_block = very_busy and my < 3.0
    return text_rgb, stroke_rgb, needs_block


# ─── face detection ───────────────────────────────────────
_face_detector = mp.solutions.face_detection.FaceDetection(
    model_selection=1, min_detection_confidence=0.4
)


def detect_face_bbox(img: Image.Image) -> list[tuple[int, int, int, int]]:
    arr = np.array(img.convert("RGB"))
    H, W = arr.shape[:2]
    res = _face_detector.process(arr)
    boxes: list[tuple[int, int, int, int]] = []
    if not res.detections:
        return boxes
    for d in res.detections:
        rb = d.location_data.relative_bounding_box
        cx = (rb.xmin + rb.width / 2) * W
        cy = (rb.ymin + rb.height / 2) * H
        bw = rb.width * W * 1.30
        bh = rb.height * H * 1.50
        x1 = max(0, int(cx - bw / 2))
        y1 = max(0, int(cy - bh / 2))
        x2 = min(W, int(cx + bw / 2))
        y2 = min(H, int(cy + bh / 2))
        boxes.append((x1, y1, x2, y2))
    return boxes


def avoid_face_collision(text_bbox, obstacles, img_h, safe_margin_px) -> int:
    tx1, ty1, tx2, ty2 = text_bbox
    for (fx1, fy1, fx2, fy2) in obstacles:
        if tx2 <= fx1 or tx1 >= fx2:
            continue
        if ty2 <= fy1 or ty1 >= fy2:
            continue
        dy_up = fy1 - ty2 - 4
        dy_down = fy2 - ty1 + 4
        up_ok = (ty1 + dy_up) >= safe_margin_px
        down_ok = (ty2 + dy_down) <= (img_h - safe_margin_px)
        if up_ok and (not down_ok or abs(dy_up) <= abs(dy_down)):
            return dy_up
        if down_ok:
            return dy_down
    return 0


# ─── GPT-vision art director ───────────────────────────────
SYSTEM = """You are a senior advertising art director designing typography for a Korean premium ad.
Return JSON typography spec for DESIGN-LEVEL composition (NOT caption-style overlay).

REFERENCE TONE — mimic these brands:
  Fashion → MUSINSA, COS, Loewe : pure black on cream, NO stroke, condensed bold sans
  Beauty → DIOR, Chanel, Sulwhasoo : pure black/white, thin elegant serif, tight tracking
  Cafe → STARBUCKS, MEGA, Blue Bottle : pure black on cream, modified serif + sans

CRITICAL COLOR RULES:
- DEFAULT: text PURE BLACK (#0A0A0A) or PURE WHITE (#FFFFFF). NOT muddy harmonic.
- NO STROKE — luxury brands never use outlines (looks like subtitle).
- bg_block: AVOID. null is best. Only use when text is fully invisible.
- color_mode default: "auto-dark" or "auto-light" — system picks pure color with best contrast.

LUXURY POLISH v3:
- Hero tracking_em: 0.10~0.25 (NEVER below 0.08). Wide tracking = luxury.
- Brand size_pct_h: 0.9~1.3. Tinier = elegant.
- Brand tracking_em: 0.45~0.70. Ultra-wide.
- Hero size_pct_h ÷ brand size_pct_h ≥ 6.

NAMED PATTERN — pick ONE that fits:
  minimal-stack | hero-fill | vertical-rail | split-half | corner-mark
  edge-bleed | magazine-cover | asymmetric-grid

FONT POOL — pick by font_id:
  ENGLISH SERIF luxury: playfair_display, cormorant_garamond, cinzel, abril_fatface
  ENGLISH SERIF editorial: dm_serif_display, eb_garamond, lora, crimson_text
  ENGLISH SANS modern: inter, manrope, dm_sans, public_sans, work_sans
  ENGLISH SANS geometric: montserrat, poppins, poppins_bold, outfit, plus_jakarta
  ENGLISH SANS condensed: bebas_neue, anton, oswald, big_shoulders, six_caps
  ENGLISH SANS impact: archivo_black, black_ops_one
  ENGLISH SCRIPT: caveat, pacifico, dancing_script, shadows_into_light
  KOREAN SANS: pretendard_light/regular/medium/bold/black
  KOREAN SERIF: gowun_batang_reg/bold, hahmlet, nanum_myeongjo, nanum_myeongjo_xb
  KOREAN ROUNDED: gowun_dodum, sunflower, single_day
  KOREAN HEAVY: black_han_sans, do_hyeon, jua
  KOREAN HANDWRITING: nanum_pen, gaegu_bold, gaegu_regular
  Diversity required — don't default to playfair_display every time.

SIZE GUIDANCE:
  - 1~3 chars  : 9~16
  - 4~6 chars  : 7~12
  - 7~9 chars  : 5~8
  - 10~12 chars: 4~6
  - 13+ chars  : 3~4
  Korean: -2 from above. Condensed fonts: +2.

POSITION (subject-aware):
  - subject CENTER → hero at y 6~14 (top) or 80~88 (bottom)
  - subject LEFT → hero at x 55~75 right side
  - subject RIGHT → hero at x 25~45 left side
  - Brand at any unused corner (y 4~96, x 4~96)

Output STRICT JSON only:
{
  "subject_location": "left-center | center | right-center | full-width",
  "pattern": "<named pattern>",
  "philosophy": "1-line design intent",
  "hero": {
    "text": "<copy>",
    "x_pct": 0~100, "y_pct": 0~100,
    "anchor": "left-top | center-top | right-top | left-center | center-center | right-center | left-bottom | center-bottom | right-bottom",
    "font_family": "<font_id>",
    "size_pct_h": 3~16, "tracking_em": 0.08~0.30,
    "rotation_deg": 0,
    "color_mode": "auto-dark | auto-light | palette-accent | custom",
    "color_hex": null, "use_stroke": false, "bg_block": null,
    "hairline_top": false, "hairline_bottom": false, "hairline_width_pct": null
  },
  "sub": { same fields, may be null },
  "brand": { same fields, size_pct_h 0.9~1.3, tracking 0.45~0.70 }
}
"""


def get_vision_spec(img_bytes: bytes, industry: str, hero: str, sub: str, brand: str) -> dict | None:
    """GPT-4o vision으로 typography spec 생성. OPENAI_API_KEY 없거나 실패 시 None 반환."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    client = OpenAI(api_key=api_key)
    b64 = base64.b64encode(img_bytes).decode()
    user_prompt = (
        f"Industry: {industry}\nCopy:\n- Hero: {hero}\n- Sub: {sub}\n- Brand: {brand}\n\n"
        "Design typography spec. Return JSON only."
    )
    last_err = None
    for attempt in range(5):
        try:
            kwargs = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    ]},
                ],
                "temperature": 0.5 + 0.1 * attempt,
                "max_tokens": 2000,
            }
            if attempt < 3:
                kwargs["response_format"] = {"type": "json_object"}
            resp = client.chat.completions.create(**kwargs)
            raw = resp.choices[0].message.content
            if raw is None:
                last_err = f"content=None ({resp.choices[0].finish_reason})"
                continue
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()
            return json.loads(raw)
        except Exception as e:
            last_err = f"{type(e).__name__}: {str(e)[:120]}"
    print(f"[pil] vision spec failed after 5 attempts: {last_err}")
    return None


# ─── PIL render ─────────────────────────────────────────────
ANCHOR_DXY = {
    "left-top": (0.0, 0.0), "center-top": (0.5, 0.0), "right-top": (1.0, 0.0),
    "left-center": (0.0, 0.5), "center-center": (0.5, 0.5), "right-center": (1.0, 0.5),
    "left-bottom": (0.0, 1.0), "center-bottom": (0.5, 1.0), "right-bottom": (1.0, 1.0),
}


def measure(draw, text, font, tracking=0):
    sp = int(font.size * tracking)
    return sum(draw.textbbox((0, 0), ch, font=font)[2] + sp for ch in text)


def draw_tracked(draw, xy, text, font, fill, tracking=0, stroke=None):
    x, y = xy
    sp = int(font.size * tracking)
    for ch in text:
        bb = draw.textbbox((x, y), ch, font=font)
        if stroke:
            sw, sc = stroke
            draw.text((x, y), ch, font=font, fill=fill, stroke_width=sw, stroke_fill=sc)
        else:
            draw.text((x, y), ch, font=font, fill=fill)
        x += (bb[2] - bb[0]) + sp


def render_text_element(layer, draw, img, elem, palette, safe_margin=0.04,
                         face_boxes=None, prev_bboxes=None):
    text = elem.get("text", "")
    if not text:
        return None
    W, H = img.size
    font_id = elem.get("font_family", "inter")
    if has_korean(text) and font_id in KR_FALLBACK:
        font_id = KR_FALLBACK[font_id]
    font_path = FONT_POOL.get(font_id) or FONT_POOL.get("inter") or FONT_POOL.get("pretendard_regular")
    if not font_path:
        return None
    size_px = max(int(H * (elem.get("size_pct_h", 5) / 100)), 12)
    tracking = max(elem.get("tracking_em", 0.08), 0.08)

    # auto-shrink
    max_text_w = int(W * (1 - 2 * safe_margin))
    font = ImageFont.truetype(font_path, size_px)
    text_w = measure(draw, text, font, tracking)
    while text_w > max_text_w and size_px > 12:
        size_px = int(size_px * 0.92)
        font = ImageFont.truetype(font_path, size_px)
        text_w = measure(draw, text, font, tracking)

    asc, desc = font.getmetrics()
    glyph_h = asc + desc

    anchor = elem.get("anchor", "left-top")
    ax, ay = ANCHOR_DXY.get(anchor, (0.0, 0.0))
    cx = W * elem.get("x_pct", 5) / 100
    cy = H * elem.get("y_pct", 10) / 100
    x = int(cx - text_w * ax)
    y = int(cy - size_px * ay)

    margin_x = int(W * safe_margin)
    margin_y = int(H * safe_margin)
    x = max(margin_x, min(x, W - margin_x - text_w))
    y = max(margin_y, min(y, H - margin_y - glyph_h))

    obstacles = list(face_boxes or []) + list(prev_bboxes or [])
    if obstacles:
        for _ in range(5):
            tbb = (x, y, x + text_w, y + glyph_h)
            dy = avoid_face_collision(tbb, obstacles, H, margin_y)
            if dy == 0:
                break
            y = max(margin_y, min(y + dy, H - margin_y - glyph_h))
        # fallback: stack under prev or move below face
        tbb = (x, y, x + text_w, y + glyph_h)
        if avoid_face_collision(tbb, obstacles, H, margin_y) != 0:
            placed = False
            if prev_bboxes:
                last_prev = prev_bboxes[-1]
                fy = last_prev[3] + 8
                stack_bbox = (x, fy, x + text_w, fy + glyph_h)
                stack_collide = any(
                    not (stack_bbox[2] <= fb[0] or stack_bbox[0] >= fb[2] or
                         stack_bbox[3] <= fb[1] or stack_bbox[1] >= fb[3])
                    for fb in (face_boxes or [])
                )
                if not stack_collide and fy + glyph_h <= H - margin_y:
                    y = fy
                    x = max(margin_x, min(last_prev[0] + 6, W - margin_x - text_w))
                    placed = True
            if not placed:
                fbottoms = [fb[3] for fb in (face_boxes or [])]
                if fbottoms:
                    cy_ = max(fbottoms) + 16
                    if cy_ + glyph_h <= H - margin_y:
                        y = cy_
                        placed = True
                if not placed:
                    y = H - margin_y - glyph_h - 4

    final_bbox = (x, y, x + text_w, y + glyph_h)
    cmode = elem.get("color_mode", "auto-dark")
    needs_block = False
    if cmode == "custom" and elem.get("color_hex"):
        text_rgb = hex2rgb(elem["color_hex"])
        stroke_rgb = hex2rgb(palette["light"])
        if contrast(luminance(text_rgb), luminance(sample_bg(img, *final_bbox))) < 4.5:
            text_rgb, stroke_rgb, needs_block = pure_color_for_bbox(img, final_bbox, palette, "auto")
    elif cmode == "palette-accent":
        text_rgb = hex2rgb(palette["accent"])
        stroke_rgb = hex2rgb(palette["light"])
        if contrast(luminance(text_rgb), luminance(sample_bg(img, *final_bbox))) < 4.5:
            text_rgb, stroke_rgb, needs_block = pure_color_for_bbox(img, final_bbox, palette, "auto")
    elif cmode == "auto-light":
        text_rgb, stroke_rgb, needs_block = pure_color_for_bbox(img, final_bbox, palette, "light")
    else:
        text_rgb, stroke_rgb, needs_block = pure_color_for_bbox(img, final_bbox, palette, "auto")

    use_stroke = elem.get("use_stroke", False)
    sw = 1 if use_stroke else 0
    stroke = (sw, (*stroke_rgb, 200)) if use_stroke else None

    block_mode = elem.get("bg_block")
    if block_mode is None and needs_block:
        block_mode = "light" if text_rgb == hex2rgb(palette["dark"]) else "dark"
    if block_mode:
        bc = hex2rgb(palette["light" if block_mode == "light" else "dark"])
        pad_x = max(int(size_px * 0.18), 6)
        pad_y = max(int(size_px * 0.08), 3)
        bx1 = max(0, x - pad_x); by1 = max(0, y - pad_y)
        bx2 = min(W, x + text_w + pad_x); by2 = min(H, y + glyph_h + pad_y)
        draw.rectangle([(bx1, by1), (bx2, by2)], fill=(*bc, 200))

    # hairline rules
    if elem.get("hairline_top") or elem.get("hairline_bottom"):
        line_color = text_rgb
        lw_pct = elem.get("hairline_width_pct")
        if lw_pct:
            lw = int(W * lw_pct / 100)
            lx1 = x + (text_w - lw) // 2
        else:
            lw = text_w
            lx1 = x
        lx2 = lx1 + lw
        gap = max(int(size_px * 0.35), 8)
        if elem.get("hairline_top"):
            ly = y - gap
            draw.line([(lx1, ly), (lx2, ly)], fill=(*line_color, 200), width=1)
        if elem.get("hairline_bottom"):
            ly = y + glyph_h + gap
            draw.line([(lx1, ly), (lx2, ly)], fill=(*line_color, 200), width=1)

    # rotation
    rotation = elem.get("rotation_deg", 0)
    if rotation and rotation != 0:
        pad = max(stroke[0] * 2 if stroke else 0, 8)
        tx_layer = Image.new("RGBA", (text_w + pad * 2, glyph_h + pad * 2), (0, 0, 0, 0))
        tx_draw = ImageDraw.Draw(tx_layer)
        draw_tracked(tx_draw, (pad, pad), text, font,
                      fill=(*text_rgb, 255), tracking=tracking, stroke=stroke)
        rot = tx_layer.rotate(rotation, resample=Image.BICUBIC, expand=True)
        rw, rh = rot.size
        rcx = W * elem.get("x_pct", 5) / 100
        rcy = H * elem.get("y_pct", 10) / 100
        rx = max(margin_x, min(int(rcx - rw * ax) - pad, W - margin_x - rw))
        ry = max(margin_y, min(int(rcy - rh * ay) - pad, H - margin_y - rh))
        layer.paste(rot, (rx, ry), rot)
        return (rx, ry, rx + rw, ry + rh)

    draw_tracked(draw, (x, y), text, font, fill=(*text_rgb, 255),
                  tracking=tracking, stroke=stroke)
    return (x, y, x + text_w, y + glyph_h)


def render_with_spec(img: Image.Image, spec: dict, palette: dict) -> Image.Image:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    face_boxes = detect_face_bbox(img)
    rendered: list = []
    for key in ("hero", "sub", "brand"):
        elem = spec.get(key)
        if elem and elem.get("text"):
            bbox = render_text_element(
                layer, draw, img, elem, palette,
                face_boxes=face_boxes, prev_bboxes=list(rendered),
            )
            if bbox:
                rendered.append((bbox[0] - 6, bbox[1] - 16, bbox[2] + 6, bbox[3] + 16))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


# ─── Legacy fallback (구버전 BE 호환 — 단순 top-left 오버레이) ────
def render_legacy(img: Image.Image, headline: str, subhead: str | None,
                   headline_color: str, subhead_color: str, logo: str | None) -> Image.Image:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    W, H = img.size
    big_path = FONT_POOL.get("pretendard_bold") or FONT_POOL.get("inter")
    mid_path = FONT_POOL.get("pretendard_regular") or FONT_POOL.get("inter")
    small_path = FONT_POOL.get("pretendard_medium") or FONT_POOL.get("inter")
    big = ImageFont.truetype(big_path, int(H * 0.06))
    mid = ImageFont.truetype(mid_path, int(H * 0.035))
    small = ImageFont.truetype(small_path, int(H * 0.025))
    grad = Image.new("RGBA", (W, int(H * 0.35)), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for yy in range(grad.size[1]):
        a = int(180 * (1 - yy / grad.size[1]))
        gd.line([(0, yy), (W, yy)], fill=(0, 0, 0, a))
    overlay.paste(grad, (0, 0), grad)
    draw.text((W * 0.05, H * 0.06), headline,
              fill=(*hex2rgb(headline_color), 255), font=big)
    if subhead:
        draw.text((W * 0.05, H * 0.16), subhead,
                  fill=(*hex2rgb(subhead_color), 230), font=mid)
    if logo:
        bbox = draw.textbbox((0, 0), logo, font=small)
        lw = bbox[2] - bbox[0]
        draw.text((W - lw - W * 0.05, H - H * 0.06), logo,
                  fill=(255, 255, 255, 255), font=small)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


# ─── routes ────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "fonts_loaded": len(FONT_POOL),
        "openai_configured": bool(os.environ.get("OPENAI_API_KEY")),
    }


@app.post("/overlay")
def overlay(req: OverlayRequest):
    try:
        img_bytes = requests.get(req.base_url, timeout=30).content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"failed to fetch base image: {e}")

    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    # 신 경로 — industry + hero_text 있으면 GPT-vision spec 생성 후 v3 렌더
    use_v3 = bool(req.industry and req.hero_text)
    if use_v3:
        palette = palette_for(req.industry)
        spec = get_vision_spec(
            img_bytes,
            industry=req.industry or "",
            hero=req.hero_text,
            sub=req.sub_text or "",
            brand=req.brand_text or "",
        )
        if spec:
            # GPT가 빠뜨릴 경우 카피 강제 주입
            if spec.get("hero"):
                spec["hero"]["text"] = req.hero_text
            if spec.get("sub") and req.sub_text:
                spec["sub"]["text"] = req.sub_text
            if spec.get("brand") and req.brand_text:
                spec["brand"]["text"] = req.brand_text
            final = render_with_spec(img, spec, palette)
        else:
            # spec 실패 → legacy fallback
            final = render_legacy(
                img,
                headline=req.hero_text,
                subhead=req.sub_text,
                headline_color="#0A0A0A",
                subhead_color="#0A0A0A",
                logo=req.brand_text,
            )
    else:
        # 구 경로 — headline/subhead/logo
        final = render_legacy(
            img,
            headline=req.headline or "",
            subhead=req.subhead,
            headline_color=req.headline_color or "#FFFFFF",
            subhead_color=req.subhead_color or "#FFFFFF",
            logo=req.logo,
        )

    buf = io.BytesIO()
    final.save(buf, "PNG", optimize=True)
    return {"image_b64": base64.b64encode(buf.getvalue()).decode()}