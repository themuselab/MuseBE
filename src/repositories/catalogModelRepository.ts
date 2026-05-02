import { prisma } from "../lib/prisma";

type ListFilter = {
  gender?: string;
  age?: string;
  primaryLabel?: string;
  keyword?: string;
};

export const listActive = (filter: ListFilter = {}) =>
  prisma.catalogModel.findMany({
    where: {
      isActive: true,
      ...(filter.gender && filter.gender !== "all" ? { gender: filter.gender } : {}),
      ...(filter.age && filter.age !== "all" ? { age: filter.age } : {}),
      ...(filter.primaryLabel && filter.primaryLabel !== "all"
        ? { primaryLabel: filter.primaryLabel }
        : {}),
      ...(filter.keyword
        ? { name: { contains: filter.keyword, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

export const findById = (id: string) =>
  prisma.catalogModel.findUnique({ where: { id } });

export const countActive = () =>
  prisma.catalogModel.count({ where: { isActive: true } });

// 사용량 기반 Top N. completed/processing job 카운트 내림차순, 동률 시 createdAt DESC.
// 사용 이력이 없는 모델도 결과에 포함시키되 usageCount=0으로.
export const listTopByUsage = async (
  limit: number,
): Promise<{ model: Awaited<ReturnType<typeof findById>> & object; usageCount: number }[]> => {
  const grouped = await prisma.job.groupBy({
    by: ["catalogModelId"],
    where: {
      catalogModelId: { not: null },
      status: { in: ["queued", "processing", "completed"] },
    },
    _count: { _all: true },
  });

  const usageMap = new Map<string, number>();
  for (const g of grouped) {
    if (g.catalogModelId) usageMap.set(g.catalogModelId, g._count._all);
  }

  const candidates = await prisma.catalogModel.findMany({
    where: { isActive: true },
  });

  const sorted = candidates
    .map((model) => ({ model, usageCount: usageMap.get(model.id) ?? 0 }))
    .sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return b.model.createdAt.getTime() - a.model.createdAt.getTime();
    })
    .slice(0, limit);

  return sorted;
};
