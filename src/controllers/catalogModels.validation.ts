import { z } from "zod";

export const listCatalogModelsQuerySchema = z.object({
  gender: z.enum(["all", "female", "male"]).optional(),
  age: z.enum(["all", "20", "30", "40", "50", "60+"]).optional(),
  primaryLabel: z
    .enum([
      "all",
      "trust",
      "friendly",
      "intimate",
      "sophisticated",
      "lively",
      "comfortable",
    ])
    .optional(),
  keyword: z.string().trim().min(1).max(50).optional(),
});

export type ListCatalogModelsQuery = z.infer<typeof listCatalogModelsQuerySchema>;
