import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

type RawMeta = {
  random_name: string;
  gender: "M" | "F";
  age: number;
  age_group: string;
  primary_label: string;
  scores_6?: Record<string, number>;
  recommended_industries?: string[];
  original_reference?: string;
  celebrity_ref?: string;
  image_path_ref?: string;
  note?: string;
};

type CatalogMockMeta = {
  slug: string;
  name: string;
  gender: string;
  age: string;
  primaryLabel: string;
  faceImageUrl: string;
  imageUrls: string[];
  scores: Record<string, number>;
  tags: string[];
  recommendedIndustries: string[];
};

const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.resolve(ROOT, "../avatars_full_backup");
const CATALOG_DIR = path.resolve(ROOT, "uploads/catalog");
const META_PATH = path.join(CATALOG_DIR, "mock-meta.json");
const SKIPPED_REPORT = path.join(CATALOG_DIR, "skipped.txt");
const UNMATCHED_REPORT = path.join(CATALOG_DIR, "unmatched-industries.txt");

const PRIMARY_LABEL_MAP: Record<string, string> = {
  "신뢰감": "trust",
  "세련됨": "sophisticated",
  "친근함": "friendly",
  "편안함": "comfortable",
  "전문성": "professional",
  "활발함": "lively",
};

const SCORE_KEY_MAP: Record<string, string> = {
  "신뢰감": "trust",
  "세련됨": "sophisticated",
  "친근함": "friendly",
  "편안함": "comfortable",
  "전문성": "professional",
  "활발함": "lively",
};

// 1~5 → 0~100 스케일
const SCORE_SCALE: Record<number, number> = {
  1: 30,
  2: 45,
  3: 60,
  4: 78,
  5: 92,
};

const INDUSTRY_MAP: Record<string, string> = {
  "교육": "education",
  "가전/생활/인테리어": "home_living",
  "여행/항공": "travel_aviation",
  "헬스/스포츠": "health_sports",
  "육아/키즈": "childcare_kids",
  "건강/제약": "health_pharma",
  "패션/의류": "fashion_clothing",
  "자동차": "automotive",
};

const GENDER_MAP: Record<string, string> = { M: "male", F: "female" };

function normalizeScores(raw: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const englishKey = SCORE_KEY_MAP[k];
    if (!englishKey) {
      throw new Error(`unknown score key: ${k}`);
    }
    const scaled = SCORE_SCALE[v];
    if (scaled === undefined) {
      throw new Error(`unknown score value: ${v} (key=${k})`);
    }
    result[englishKey] = scaled;
  }
  for (const required of [
    "trust",
    "sophisticated",
    "friendly",
    "comfortable",
    "professional",
    "lively",
  ]) {
    if (result[required] === undefined) {
      throw new Error(`missing score axis: ${required}`);
    }
  }
  return result;
}

async function copyVariants(srcDir: string, slug: string): Promise<string[]> {
  const destDir = path.join(CATALOG_DIR, slug);
  await fs.mkdir(destDir, { recursive: true });
  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const src = path.join(srcDir, `variant_${i}.png`);
    if (!existsSync(src)) continue;
    const dest = path.join(destDir, `variant_${i}.png`);
    await fs.copyFile(src, dest);
    urls.push(`/uploads/catalog/${slug}/variant_${i}.png`);
  }
  return urls;
}

async function loadExistingMeta(): Promise<CatalogMockMeta[]> {
  try {
    const raw = await fs.readFile(META_PATH, "utf-8");
    return JSON.parse(raw) as CatalogMockMeta[];
  } catch {
    return [];
  }
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`source not found: ${SOURCE_DIR}`);
  }
  await fs.mkdir(CATALOG_DIR, { recursive: true });

  const categories = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
  const folders: { category: string; name: string; absPath: string }[] = [];
  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    const catPath = path.join(SOURCE_DIR, cat.name);
    const models = await fs.readdir(catPath, { withFileTypes: true });
    for (const m of models) {
      if (!m.isDirectory()) continue;
      folders.push({
        category: cat.name,
        name: m.name,
        absPath: path.join(catPath, m.name),
      });
    }
  }
  // 결정적 정렬: 카테고리 → 이름
  folders.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  console.log(`[scan] total folders: ${folders.length}`);

  const skipped: string[] = [];
  const unmatchedIndustries = new Set<string>();
  const newEntries: CatalogMockMeta[] = [];
  const usedNames = new Map<string, number>();
  let slugIndex = 0;

  for (const folder of folders) {
    const metaPath = path.join(folder.absPath, "metadata.json");
    if (!existsSync(metaPath)) {
      skipped.push(`${folder.category}/${folder.name} - no metadata.json`);
      continue;
    }
    const raw = JSON.parse(await fs.readFile(metaPath, "utf-8")) as RawMeta;

    if (!raw.scores_6 || !raw.recommended_industries) {
      skipped.push(
        `${folder.category}/${folder.name} - format B (no scores_6 or recommended_industries)`,
      );
      continue;
    }

    // variant 이미지 1장도 없으면 스킵 (face-swap 불가)
    const hasAnyVariant = [1, 2, 3, 4].some((i) =>
      existsSync(path.join(folder.absPath, `variant_${i}.png`)),
    );
    if (!hasAnyVariant) {
      skipped.push(`${folder.category}/${folder.name} - no variant images`);
      continue;
    }

    slugIndex++;
    const slug = `avatar-${String(slugIndex).padStart(3, "0")}`;

    const gender = GENDER_MAP[raw.gender];
    if (!gender) {
      throw new Error(`unknown gender: ${raw.gender} (${folder.name})`);
    }
    const primaryLabel = PRIMARY_LABEL_MAP[raw.primary_label];
    if (!primaryLabel) {
      throw new Error(
        `unknown primary_label: ${raw.primary_label} (${folder.name})`,
      );
    }

    const scores = normalizeScores(raw.scores_6);
    const recommendedIndustries: string[] = [];
    for (const ind of raw.recommended_industries) {
      const code = INDUSTRY_MAP[ind];
      if (!code) {
        unmatchedIndustries.add(ind);
        continue;
      }
      recommendedIndustries.push(code);
    }

    const imageUrls = await copyVariants(folder.absPath, slug);
    const tags = [raw.primary_label]; // 한글 태그 (FE는 tags를 한글로 노출 — mock-1/2/3와 동일 패턴)

    // 중복 이름 disambiguation (seed.ts가 name 기준 upsert이므로 충돌 방지)
    const baseName = raw.random_name;
    const seen = usedNames.get(baseName) ?? 0;
    usedNames.set(baseName, seen + 1);
    const name = seen === 0 ? baseName : `${baseName}${seen + 1}`;

    newEntries.push({
      slug,
      name,
      gender,
      age: raw.age_group,
      primaryLabel,
      faceImageUrl: imageUrls[0],
      imageUrls,
      scores,
      tags,
      recommendedIndustries,
    });

    console.log(`[import] ${slug} ${raw.random_name} (${folder.category})`);
  }

  // 기존 mock-meta.json (mock-1/2/3) 보존 + 신규 entry 추가
  // 기존 entry 중 slug가 avatar-* 인 건 새것으로 교체 (재실행 시 멱등성)
  const existing = await loadExistingMeta();
  const preserved = existing.filter((e) => !e.slug.startsWith("avatar-"));
  const merged = [...preserved, ...newEntries];

  await fs.writeFile(META_PATH, JSON.stringify(merged, null, 2));
  console.log(`[done] meta written: ${merged.length} entries (${preserved.length} preserved + ${newEntries.length} new)`);

  if (skipped.length > 0) {
    await fs.writeFile(SKIPPED_REPORT, skipped.join("\n") + "\n");
    console.log(`[skipped] ${skipped.length} folders → ${SKIPPED_REPORT}`);
  } else if (existsSync(SKIPPED_REPORT)) {
    await fs.unlink(SKIPPED_REPORT);
  }

  if (unmatchedIndustries.size > 0) {
    const list = Array.from(unmatchedIndustries).sort();
    await fs.writeFile(UNMATCHED_REPORT, list.join("\n") + "\n");
    console.log(
      `[WARNING] unmatched industries: ${list.length} → ${UNMATCHED_REPORT}`,
    );
  } else if (existsSync(UNMATCHED_REPORT)) {
    await fs.unlink(UNMATCHED_REPORT);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
