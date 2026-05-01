/**
 * E2E 풀 사이클 호출 + 응답 캡처.
 * 사용: tsx scripts/captureFullFlow.ts > /tmp/flow-capture.txt 2>&1
 */
import fs from "node:fs";
import "dotenv/config";

const BASE = "http://localhost:4000";
const PRODUCT_PATH = "/tmp/test-product.png";
const POLL_INTERVAL_MS = 3000;
const POLL_MAX = 30;

const log = (label: string, data: unknown) => {
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(data, null, 2));
};

const req = async (
  method: string,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown; headers: Record<string, string> }> => {
  const res = await fetch(`${BASE}${path}`, { method, ...init });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });
  return { status: res.status, body, headers };
};

const TEST_EMAIL = `flow-${Date.now()}@muse.dev`;
const TEST_PW = "Test1234!";

async function main() {
  console.log(`[start] ${new Date().toISOString()}`);

  // 1) signup
  const signup = await req("POST", "/auth/signup", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PW,
      userType: "advertiser",
      ageGroup: "30s",
      terms: { service: true, privacy: true, overseas: true, adid: true },
      business: { industryMain: "카페" },
    }),
  });
  log("1. POST /auth/signup", signup);

  // 2) login
  const login = await req("POST", "/auth/login", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PW }),
  });
  log("2. POST /auth/login", login);
  const token = (login.body as { data: { accessToken: string } }).data.accessToken;
  const auth = { Authorization: `Bearer ${token}` };

  // 3) catalog list
  const catalog = await req("GET", "/catalog-models", { headers: auth });
  log("3. GET /catalog-models", catalog);
  const catalogId = (
    catalog.body as { data: { items: { id: string }[] } }
  ).data.items[0].id;

  // 4) catalog top5
  const top = await req("GET", "/catalog-models/top", { headers: auth });
  log("4. GET /catalog-models/top", top);

  // 5) catalog filter
  const filtered = await req(
    "GET",
    "/catalog-models?gender=female&age=20s&primaryLabel=sophisticated",
    { headers: auth },
  );
  log("5. GET /catalog-models?gender=female&age=20s&primaryLabel=sophisticated", filtered);

  // 6) mood recommendations
  const moods = await req("POST", "/ads/moods", {
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ industry: "카페", item: "라떼" }),
  });
  log("6. POST /ads/moods", moods);

  // 7) generate (multipart)
  const fd = new FormData();
  fd.append("catalogModelId", catalogId);
  fd.append("prompt", "cafe morning shot with warm light");
  fd.append("headline", "따뜻한 봄날의 라떼");
  fd.append("subhead", "오늘 오후 2시 오픈");
  fd.append("industry", "카페");
  fd.append("item", "라떼");
  fd.append("mood", "따뜻한 아침 햇살");
  const buf = fs.readFileSync(PRODUCT_PATH);
  fd.append("productImage", new Blob([buf], { type: "image/png" }), "product.png");

  const generate = await req("POST", "/ads/generate", {
    headers: auth,
    body: fd,
  });
  log("7. POST /ads/generate", generate);
  const jobId = (generate.body as { data: { jobId: string } }).data.jobId;

  // 8) poll until completed
  let polls = 0;
  let final: { status: number; body: unknown } | null = null;
  while (polls < POLL_MAX) {
    polls++;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const j = await req("GET", `/ads/jobs/${jobId}`, { headers: auth });
    const data = (j.body as { data: { status: string; progress: number } }).data;
    console.log(`  poll #${polls}: status=${data.status} progress=${data.progress}`);
    if (data.status === "completed" || data.status === "failed") {
      final = j;
      break;
    }
  }
  log(`8. GET /ads/jobs/${jobId} (final, ${polls} polls)`, final);

  // 9) my history
  const history = await req("GET", "/ads/jobs", { headers: auth });
  log("9. GET /ads/jobs", history);

  // 10) error: catalog model not found
  const wrongCatalog = await req("POST", "/ads/generate", {
    headers: auth,
    body: (() => {
      const f = new FormData();
      f.append("catalogModelId", "nonexistent-id");
      f.append("prompt", "x");
      f.append("productImage", new Blob([buf], { type: "image/png" }), "p.png");
      return f;
    })(),
  });
  log("10. POST /ads/generate (잘못된 catalogModelId)", wrongCatalog);

  // 11) error: product image missing
  const noProduct = await req("POST", "/ads/generate", {
    headers: auth,
    body: (() => {
      const f = new FormData();
      f.append("catalogModelId", catalogId);
      f.append("prompt", "x");
      return f;
    })(),
  });
  log("11. POST /ads/generate (productImage 누락)", noProduct);

  // 12) error: unauthenticated
  const noauth = await req("GET", "/catalog-models");
  log("12. GET /catalog-models (비로그인)", noauth);

  // 13) static gating - own ad
  const resultUrl = (final?.body as { data: { resultUrl: string | null } } | null)
    ?.data?.resultUrl;
  if (resultUrl) {
    const ownImg = await req("GET", resultUrl, { headers: auth });
    log(`13. GET ${resultUrl} (본인 광고 이미지)`, {
      status: ownImg.status,
      contentType: ownImg.headers["content-type"],
      size:
        typeof ownImg.body === "string"
          ? ownImg.body.length
          : "json (이건 이미지여야 정상)",
    });
  }

  // 14) static gating - other user
  const other = await req("POST", "/auth/signup", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `other-${Date.now()}@muse.dev`,
      password: TEST_PW,
      userType: "advertiser",
      ageGroup: "30s",
      terms: { service: true, privacy: true, overseas: true, adid: true },
      business: { industryMain: "카페" },
    }),
  });
  void other;
  const otherLogin = await req("POST", "/auth/login", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: (
        (await (
          await fetch(`${BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PW }),
          })
        ).json()) as { data: { user: { email: string } } }
      ).data.user.email,
      password: TEST_PW,
    }),
  });
  void otherLogin;

  console.log(`\n[done] ${new Date().toISOString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
