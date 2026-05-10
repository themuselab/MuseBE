type OverlayInput = {
  baseUrl: string;
  // v3 — GPT-vision spec 경로 (industry + heroText 모두 있을 때 활성화)
  industry?: string;
  heroText?: string;
  subText?: string;
  brandText?: string;
  // 구버전 — 단순 top-left 오버레이 (BE 기존 호출자 호환)
  headline?: string;
  subhead?: string;
  headlineColor?: string;
  subheadColor?: string;
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

  // v3 경로 우선 — industry+heroText 있으면 GPT-vision spec 기반 design-level 렌더링.
  // 둘 다 있을 때만 v3 활성화. 기존 호출(headline만 전달)은 legacy 경로로 폴백돼 동작 유지.
  const usingV3 = !!(input.industry && input.heroText);

  const body = usingV3
    ? {
        base_url: input.baseUrl,
        industry: input.industry,
        hero_text: input.heroText,
        sub_text: input.subText ?? null,
        brand_text: input.brandText ?? null,
        template: input.template ?? "instagram_square",
      }
    : {
        base_url: input.baseUrl,
        headline: input.headline ?? "",
        subhead: input.subhead ?? null,
        headline_color: input.headlineColor ?? "#FFFFFF",
        subhead_color: input.subheadColor ?? "#FFFFFF",
        logo: input.logo ?? null,
        template: input.template ?? "instagram_square",
      };

  const res = await fetch(`${url}/overlay`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PIL service ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { image_b64: string };
  return { buffer: Buffer.from(json.image_b64, "base64") };
}
