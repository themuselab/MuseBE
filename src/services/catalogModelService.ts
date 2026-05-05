import * as catalogModelRepository from "../repositories/catalogModelRepository";
import {
  GENDER_DISPLAY,
  AGE_DISPLAY,
} from "../controllers/catalogModels.validation";
import type { CatalogModel } from "@prisma/client";

type ListInput = {
  gender?: string;
  age?: string;
  primaryLabel?: string;
  keyword?: string;
};

type Scores = {
  trust: number;
  sophisticated: number;
  friendly: number;
  comfortable: number;
  professional: number;
  lively: number;
};

const DEFAULT_SCORES: Scores = {
  trust: 60,
  sophisticated: 60,
  friendly: 60,
  comfortable: 60,
  professional: 60,
  lively: 60,
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
};

const toScores = (value: unknown): Scores => {
  if (!value || typeof value !== "object") return DEFAULT_SCORES;
  const v = value as Record<string, unknown>;
  return {
    trust: typeof v.trust === "number" ? v.trust : DEFAULT_SCORES.trust,
    sophisticated:
      typeof v.sophisticated === "number"
        ? v.sophisticated
        : DEFAULT_SCORES.sophisticated,
    friendly: typeof v.friendly === "number" ? v.friendly : DEFAULT_SCORES.friendly,
    comfortable:
      typeof v.comfortable === "number" ? v.comfortable : DEFAULT_SCORES.comfortable,
    professional:
      typeof v.professional === "number" ? v.professional : DEFAULT_SCORES.professional,
    lively: typeof v.lively === "number" ? v.lively : DEFAULT_SCORES.lively,
  };
};

const toDisplayGender = (gender: string): string => {
  if (gender === "female" || gender === "male") return GENDER_DISPLAY[gender];
  return gender;
};

const toDisplayAge = (age: string): string => {
  if (
    age === "20s" ||
    age === "30s" ||
    age === "40s" ||
    age === "50s" ||
    age === "60s_plus"
  ) {
    return AGE_DISPLAY[age];
  }
  return age;
};

export type CatalogModelDto = {
  id: string;
  name: string;
  gender: string;
  age: string;
  primaryLabel: string;
  imageUrl: string;
  imageUrls: string[];
  scores: Scores;
  tags: string[];
  recommendedIndustries: string[];
  rank: number | null;
};

const serialize = (m: CatalogModel): CatalogModelDto => {
  const imageUrls = toStringArray(m.imageUrls);
  return {
    id: m.id,
    name: m.name,
    gender: toDisplayGender(m.gender),
    age: toDisplayAge(m.age),
    primaryLabel: m.primaryLabel,
    imageUrl: m.faceImageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : [m.faceImageUrl],
    scores: toScores(m.scores),
    tags: toStringArray(m.tags),
    recommendedIndustries: toStringArray(m.recommendedIndustries),
    rank: m.rank,
  };
};

export const listCatalog = async (input: ListInput) => {
  const items = await catalogModelRepository.listActive(input);
  return items.map(serialize);
};

export const getTotalCount = () => catalogModelRepository.countActive();

export const listTop = async (limit = 5) => {
  const items = await catalogModelRepository.listTopByUsage(limit);
  return items.map((row, idx) => ({
    ...serialize(row.model),
    rank: idx + 1,
    usageCount: row.usageCount,
  }));
};

// preferredLabel(한국어) → score 키 매핑
const LABEL_TO_SCORE_KEY: Record<string, keyof Scores> = {
  신뢰감: "trust",
  세련됨: "sophisticated",
  친근함: "friendly",
  편안함: "comfortable",
  전문성: "professional",
  활기참: "lively",
};

/**
 * 업종 + 인상 라벨로 카탈로그 모델 자동 추천.
 *
 * 1순위: recommendedIndustries 배열에 industry 포함된 모델 중
 *   - preferredLabel 있으면: 해당 score 가장 높은 모델
 *   - 없으면: rank 가장 높은(낮은 숫자) 모델
 * 2순위: industry 매칭 모델이 없으면 전체 active 중 rank 1위.
 */
export const recommendByIndustry = async (
  industry: string,
  preferredLabel?: string,
): Promise<CatalogModelDto | null> => {
  const all = await catalogModelRepository.listActive({});
  if (all.length === 0) return null;

  const matched = all.filter((m) => {
    const inds = toStringArray(m.recommendedIndustries);
    return inds.some((ind) => ind === industry || ind.includes(industry) || industry.includes(ind));
  });
  const pool = matched.length > 0 ? matched : all;

  const scoreKey = preferredLabel ? LABEL_TO_SCORE_KEY[preferredLabel] : undefined;

  const sorted = [...pool].sort((a, b) => {
    if (scoreKey) {
      const aScore = toScores(a.scores)[scoreKey];
      const bScore = toScores(b.scores)[scoreKey];
      if (bScore !== aScore) return bScore - aScore;
    }
    const aRank = a.rank ?? Number.MAX_SAFE_INTEGER;
    const bRank = b.rank ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const picked = sorted[0];
  return picked ? serialize(picked) : null;
};
