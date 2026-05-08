from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import requests
import io
import base64

app = FastAPI(title="Muse PIL Overlay Service")


class OverlayRequest(BaseModel):
    base_url: str
    headline: str
    subhead: str | None = None
    # 텍스트 색 — hex string. 미지정 시 기존 흰색 유지(구버전 BE 호환).
    headline_color: str = "#FFFFFF"
    subhead_color: str = "#FFFFFF"
    # logo가 null/생략/빈 문자열이면 워터마크 미삽입.
    # BE가 사용자 입력 카피·CTA 외 자동 브랜드 워터마크를 박지 않도록 결정함에 따라 옵셔널화.
    logo: str | None = None
    template: str = "instagram_square"


def hex_to_rgba(hex_str: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_str.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return (255, 255, 255, alpha)
    try:
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except ValueError:
        return (255, 255, 255, alpha)
    return (r, g, b, alpha)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/overlay")
def overlay(req: OverlayRequest):
    try:
        img_bytes = requests.get(req.base_url, timeout=30).content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"failed to fetch base image: {e}")

    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    W, H = img.size

    big = ImageFont.truetype("/fonts/Pretendard-Bold.ttf", int(H * 0.06))
    mid = ImageFont.truetype("/fonts/Pretendard-Regular.ttf", int(H * 0.035))
    small = ImageFont.truetype("/fonts/Pretendard-Medium.ttf", int(H * 0.025))

    grad = Image.new("RGBA", (W, int(H * 0.35)), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(grad.size[1]):
        alpha = int(180 * (1 - y / grad.size[1]))
        gd.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    overlay.paste(grad, (0, 0), grad)

    draw.text(
        (W * 0.05, H * 0.06),
        req.headline,
        fill=hex_to_rgba(req.headline_color, 255),
        font=big,
    )
    if req.subhead:
        draw.text(
            (W * 0.05, H * 0.16),
            req.subhead,
            fill=hex_to_rgba(req.subhead_color, 230),
            font=mid,
        )

    # logo가 빈 값이면 하단 워터마크 그리기 자체를 스킵.
    if req.logo:
        bbox = draw.textbbox((0, 0), req.logo, font=small)
        lw = bbox[2] - bbox[0]
        draw.text(
            (W - lw - W * 0.05, H - H * 0.06),
            req.logo,
            fill=(255, 255, 255, 255),
            font=small,
        )

    final = Image.alpha_composite(img, overlay).convert("RGB")
    buf = io.BytesIO()
    final.save(buf, "PNG", optimize=True)
    return {"image_b64": base64.b64encode(buf.getvalue()).decode()}
