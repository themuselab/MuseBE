import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

type CreateJobData = {
  userId: string;
  catalogModelId?: string | null;
  templateId?: string | null;
  prompt: string;
  headline?: string | null;
  subhead?: string | null;
  cta?: string | null;
  industry?: string | null;
  item?: string | null;
  extraDescription?: string | null;
  mood?: string | null;
  productImagePath?: string | null;
};

export const createJob = (data: CreateJobData) =>
  prisma.job.create({
    data: {
      userId: data.userId,
      catalogModelId: data.catalogModelId ?? null,
      templateId: data.templateId ?? null,
      prompt: data.prompt,
      headline: data.headline ?? null,
      subhead: data.subhead ?? null,
      cta: data.cta ?? null,
      industry: data.industry ?? null,
      item: data.item ?? null,
      extraDescription: data.extraDescription ?? null,
      mood: data.mood ?? null,
      productImagePath: data.productImagePath ?? null,
      status: "queued",
      progress: 0,
    },
  });

export const findById = (id: string) =>
  prisma.job.findUnique({ where: { id } });

export const findByIdAndUser = (id: string, userId: string) =>
  prisma.job.findFirst({
    where: { id, userId },
    include: { catalogModel: { select: { id: true, name: true } } },
  });

export const deleteById = (id: string) =>
  prisma.job.delete({ where: { id } });

type ListByUserOptions = {
  status?: string;
  cursor?: string;
  limit?: number;
};

export const listByUser = (userId: string, options: ListByUserOptions = {}) => {
  const limit = Math.min(options.limit ?? 20, 100);
  const statusWhere: Prisma.JobWhereInput = options.status
    ? { status: options.status }
    : { NOT: { status: "failed" } };
  return prisma.job.findMany({
    where: { userId, ...statusWhere },
    include: { catalogModel: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : {}),
  });
};

type UpdateProgressData = {
  status?: string;
  progress?: number;
  errorMessage?: string | null;
  resultUrl?: string | null;
  originalResultUrl?: string | null;
  baseImageUrl?: string | null;
  intermediateUrls?: Prisma.InputJsonValue;
  textOverlays?: Prisma.InputJsonValue;
  headline?: string | null;
  subhead?: string | null;
  cta?: string | null;
  costCents?: number;
  seed?: bigint | null;
  falRequestId?: string | null;
  startedAt?: Date;
  completedAt?: Date;
};

export const updateJob = (id: string, data: UpdateProgressData) =>
  prisma.job.update({
    where: { id },
    data,
  });

export const countByUserMonth = async (userId: string, yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return 0;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return prisma.job.count({
    where: {
      userId,
      createdAt: { gte: start, lt: end },
    },
  });
};
