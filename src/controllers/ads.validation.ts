import { z } from "zod";

export const moodRequestSchema = z.object({
  industry: z.string().trim().min(1).max(50),
  item: z.string().trim().min(1).max(100),
  extraDescription: z.string().trim().max(500).optional(),
});
export type MoodRequest = z.infer<typeof moodRequestSchema>;

// productImagePath는 우리 BE가 발급한 경로여야 함 — `/uploads/products/`로 시작
const productImagePathSchema = z
  .string()
  .min(1)
  .regex(/^\/uploads\/products\//, "productImagePath는 BE 업로드 경로여야 합니다");

export const generateAdSchema = z.object({
  catalogModelId: z.string().min(1),
  productImagePath: productImagePathSchema,
  prompt: z.string().trim().min(1).max(1000),
  headline: z.string().trim().max(100).optional(),
  subhead: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(50).optional(),
  item: z.string().trim().max(100).optional(),
  extraDescription: z.string().trim().max(500).optional(),
  mood: z.string().trim().max(200).optional(),
});
export type GenerateAdRequest = z.infer<typeof generateAdSchema>;

export const listJobsQuerySchema = z.object({
  status: z.enum(["queued", "processing", "completed", "failed"]).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
