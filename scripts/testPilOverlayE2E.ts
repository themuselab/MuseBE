/**
 * BE → PIL e2e 격리 테스트.
 *
 * 검증 범위 (Postgres/Redis/worker 의존 없이):
 *   - pilClient.overlayKoreanText 가 신 v3 경로(industry+heroText)로 호출 시 정상 동작
 *   - pilClient.overlayKoreanText 가 구 legacy 경로(headline only)로 호출 시 정상 동작
 *   - 결과 buffer 가 PNG 로 저장되고 적정 크기인지
 *
 * 사용:
 *   PIL_SERVICE_URL=http://127.0.0.1:8801 npx tsx scripts/testPilOverlayE2E.ts
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fal } from "@fal-ai/client";
import { overlayKoreanText } from "../src/lib/pilClient";

const SAMPLE = "c:/Users/somem/Desktop/창업/뮤즈백엔드/모델링/muse_outputs/kmong_portfolio_lora_only/B1_celeb_serum_2_final.png";
const OUT_DIR = path.join(__dirname, "test_output_e2e");

async function uploadSample(): Promise<string> {
  if (!process.env.FAL_KEY) {
    // .env가 모델링 쪽에 있을 수 있으니 체크
    const modelEnv = "c:/Users/somem/Desktop/창업/뮤즈백엔드/모델링/.env";
    try {
      const txt = await fs.readFile(modelEnv, "utf-8");
      for (const line of txt.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
        const [k, ...rest] = trimmed.split("=");
        const v = rest.join("=").replace(/^['"]|['"]$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {/* ignore */}
  }
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY env required");
  fal.config({ credentials: process.env.FAL_KEY });

  const buf = await fs.readFile(SAMPLE);
  const u8 = new Uint8Array(buf.byteLength);
  u8.set(buf);
  const blob = new Blob([u8], { type: "image/png" });
  const file = new File([blob], "test-e2e.png", { type: "image/png" });
  return fal.storage.upload(file);
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  if (!process.env.PIL_SERVICE_URL) {
    process.env.PIL_SERVICE_URL = "http://127.0.0.1:8801";
  }
  console.log(`PIL_SERVICE_URL = ${process.env.PIL_SERVICE_URL}`);

  console.log("\n[1] fal.storage upload");
  const baseUrl = await uploadSample();
  console.log(`  → ${baseUrl}`);

  console.log("\n[2] v3 path — industry + heroText/subText/brandText");
  const v3 = await overlayKoreanText({
    baseUrl,
    industry: "뷰티·화장품",
    heroText: "RADIANCE",
    subText: "ANTI-AGING SERUM  ·  N°01",
    brandText: "LUMIÈRE",
    // legacy fallback fields are ignored by v3 path
    headline: "RADIANCE",
    subhead: "ANTI-AGING SERUM",
    headlineColor: "#0A0A0A",
    subheadColor: "#0A0A0A",
  });
  await fs.writeFile(path.join(OUT_DIR, "v3.png"), v3.buffer);
  console.log(`  ✅ v3 saved (${v3.buffer.length} bytes)`);

  console.log("\n[3] legacy path — headline only (no industry)");
  const legacy = await overlayKoreanText({
    baseUrl,
    headline: "안티에이징 세럼",
    subhead: "프리미엄 라인",
    headlineColor: "#FFFFFF",
    logo: "MUSE",
  });
  await fs.writeFile(path.join(OUT_DIR, "legacy.png"), legacy.buffer);
  console.log(`  ✅ legacy saved (${legacy.buffer.length} bytes)`);

  // 사이즈 sanity — PIL 빈 응답이면 ~1KB 이하로 떨어짐
  const minBytes = 50_000;
  if (v3.buffer.length < minBytes) throw new Error(`v3 too small: ${v3.buffer.length}`);
  if (legacy.buffer.length < minBytes) throw new Error(`legacy too small: ${legacy.buffer.length}`);

  console.log(`\n출력 위치: ${OUT_DIR}`);
  console.log("✅ all paths passed");
}

main().catch((err: unknown) => {
  console.error("❌", err instanceof Error ? err.stack : err);
  process.exit(1);
});