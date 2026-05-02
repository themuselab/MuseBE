import { z } from "zod";

export const GENDER_FILTER_VALUES = ["all", "female", "male"] as const;
export const AGE_FILTER_VALUES = [
  "all",
  "20s",
  "30s",
  "40s",
  "50s",
  "60s_plus",
] as const;
export const IMPRESSION_FILTER_VALUES = [
  "all",
  "trust",
  "sophisticated",
  "friendly",
  "comfortable",
  "professional",
  "lively",
] as const;

export const listCatalogModelsQuerySchema = z.object({
  gender: z.enum(GENDER_FILTER_VALUES).optional(),
  age: z.enum(AGE_FILTER_VALUES).optional(),
  primaryLabel: z.enum(IMPRESSION_FILTER_VALUES).optional(),
  keyword: z.string().trim().min(1).max(50).optional(),
});

export type ListCatalogModelsQuery = z.infer<typeof listCatalogModelsQuerySchema>;

export const GENDER_DISPLAY: Record<"female" | "male", "여" | "남"> = {
  female: "여",
  male: "남",
};

export const AGE_DISPLAY: Record<
  "20s" | "30s" | "40s" | "50s" | "60s_plus",
  string
> = {
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
  "60s_plus": "60대 이상",
};

export const IMPRESSION_TAG_DISPLAY: Record<
  "trust" | "sophisticated" | "friendly" | "comfortable" | "professional" | "lively",
  string
> = {
  trust: "신뢰감",
  sophisticated: "세련됨",
  friendly: "친근함",
  comfortable: "편안함",
  professional: "전문성",
  lively: "활발함",
};
