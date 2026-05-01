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
    logo: str = "MUSE"
    template: str = "instagram_square"


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
        fill=(255, 255, 255, 255),
        font=big,
    )
    if req.subhead:
        draw.text(
            (W * 0.05, H * 0.16),
            req.subhead,
            fill=(255, 255, 255, 230),
            font=mid,
        )

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
