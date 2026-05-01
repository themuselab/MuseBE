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
      logo: input.logo ?? "MUSE",
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
