import { z } from "zod";

const AGE_GROUPS = ["20s", "30s", "40s", "50s", "60s_plus"] as const;

export const patchMeSchema = z.object({
  ageGroup: z.enum(AGE_GROUPS).optional(),
  business: z
    .object({
      industryMain: z.string().min(1).optional(),
      businessName: z.string().max(50, "사업자명은 50자 이하여야 합니다").optional(),
      businessDuration: z.string().min(1).optional(),
    })
    .optional(),
});

export type PatchMeDto = z.infer<typeof patchMeSchema>;
