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
  stable: number;
  cheerful: number;
};

const DEFAULT_SCORES: Scores = {
  trust: 60,
  sophisticated: 60,
  friendly: 60,
  stable: 60,
  cheerful: 60,
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
    stable: typeof v.stable === "number" ? v.stable : DEFAULT_SCORES.stable,
    cheerful: typeof v.cheerful === "number" ? v.cheerful : DEFAULT_SCORES.cheerful,
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
