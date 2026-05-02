import * as jobRepository from "../repositories/jobRepository";
import * as catalogModelRepository from "../repositories/catalogModelRepository";
import { adErrors } from "../errors/adErrors";
import { getAdGenerationQueue } from "../lib/queue";
import type { Job } from "@prisma/client";

type CreateJobInput = {
  userId: string;
  catalogModelId: string;
  prompt: string;
  headline?: string;
  subhead?: string;
  industry?: string;
  item?: string;
  extraDescription?: string;
  mood?: string;
  productImagePath?: string;
};

const serializeJob = (job: Job) => ({
  id: job.id,
  status: job.status,
  progress: job.progress,
  resultUrl: job.resultUrl,
  intermediateUrls: job.intermediateUrls,
  textOverlays: job.textOverlays,
  errorMessage: job.errorMessage,
  costCents: job.costCents,
  catalogModelId: job.catalogModelId,
  prompt: job.prompt,
  headline: job.headline,
  subhead: job.subhead,
  industry: job.industry,
  item: job.item,
  extraDescription: job.extraDescription,
  mood: job.mood,
  productImagePath: job.productImagePath,
  createdAt: job.createdAt,
  startedAt: job.startedAt,
  completedAt: job.completedAt,
});

export const createJob = async (input: CreateJobInput) => {
  const catalog = await catalogModelRepository.findById(input.catalogModelId);
  if (!catalog || !catalog.isActive) {
    throw adErrors.catalogModelNotFound();
  }

  const job = await jobRepository.createJob({
    userId: input.userId,
    catalogModelId: input.catalogModelId,
    prompt: input.prompt,
    headline: input.headline,
    subhead: input.subhead,
    industry: input.industry,
    item: input.item,
    extraDescription: input.extraDescription,
    mood: input.mood,
    productImagePath: input.productImagePath,
  });

  await getAdGenerationQueue().add(
    "generate",
    { jobId: job.id },
    { jobId: job.id },
  );

  return {
    jobId: job.id,
    status: job.status,
    estimatedSeconds: 60,
    pollUrl: `/ads/jobs/${job.id}`,
  };
};

export const getJobForUser = async (jobId: string, userId: string) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw adErrors.jobNotFound();
  if (job.userId !== userId) throw adErrors.jobForbidden();
  return serializeJob(job);
};

type ListMyJobsInput = {
  userId: string;
  status?: string;
  cursor?: string;
  limit?: number;
};

export const listMyJobs = async (input: ListMyJobsInput) => {
  const limit = Math.min(input.limit ?? 20, 100);
  const items = await jobRepository.listByUser(input.userId, {
    status: input.status,
    cursor: input.cursor,
    limit,
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id ?? null : null;

  return {
    items: trimmed.map(serializeJob),
    nextCursor,
  };
};
