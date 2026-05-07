type OverlayInput = {
  baseUrl: string;
  headline: string;
  subhead?: string;
  logo?: string;
  template?: string;
};

type OverlayResult = {
  buffer: Buffer;
};

export async function overlayKoreanText(
  input: OverlayInput,
): Promise<OverlayResult> {
  const url = process.env.PIL_SERVICE_URL;
  if (!url) throw new Error("PIL_SERVICE_URL env is required");

  const res = await fetch(`${url}/overlay`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      base_url: input.baseUrl,
      headline: input.headline,
      subhead: input.subhead ?? null,
      // logo 미지정 시 PIL 측에서 워터마크 미삽입(null) — 사용자 카피·CTA만 노출.
      // 기존엔 "MUSE" 하드코딩 워터마크가 광고 하단에 박혀있어 다운로드 시에도
      // 사용자 의도와 무관한 브랜드명이 노출되는 문제가 있었음.
      logo: input.logo ?? null,
      template: input.template ?? "instagram_square",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PIL service ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { image_b64: string };
  return { buffer: Buffer.from(json.image_b64, "base64") };
}
