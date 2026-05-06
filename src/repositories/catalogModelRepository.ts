import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

type SortOption = "recommend" | "popular";

type ListFilter = {
  gender?: string;
  age?: string;
  primaryLabel?: string;
  keyword?: string;
  sort?: SortOption;
};

const buildWhere = (filter: ListFilter): Prisma.CatalogModelWhereInput => ({
  isActive: true,
  ...(filter.gender && filter.gender !== "all" ? { gender: filter.gender } : {}),
  ...(filter.age && filter.age !== "all" ? { age: filter.age } : {}),
  ...(filter.primaryLabel && filter.primaryLabel !== "all"
    ? { primaryLabel: filter.primaryLabel }
    : {}),
  ...(filter.keyword
    ? { name: { contains: filter.keyword, mode: "insensitive" } }
    : {}),
});

export const listActive = async (filter: ListFilter = {}) => {
  const where = buildWhere(filter);

  if (filter.sort === "popular") {
    // 잡 사용 수(queued/processing/completed) 내림차순. 동률 시 createdAt DESC.
    // listTopByUsage와 동일한 메모리 정렬 패턴 — 모델 수가 적어 충분.
    const candidates = await prisma.catalogModel.findMany({ where });
    if (candidates.length === 0) return candidates;

    const grouped = await prisma.job.groupBy({
      by: ["catalogModelId"],
      where: {
        catalogModelId: { in: candidates.map((m) => m.id) },
        status: { in: ["queued", "processing", "completed"] },
      },
      _count: { _all: true },
    });
    const usageMap = new Map<string, number>();
    for (const g of grouped) {
      if (g.catalogModelId) usageMap.set(g.catalogModelId, g._count._all);
    }

    return candidates.sort((a, b) => {
      const ua = usageMap.get(a.id) ?? 0;
      const ub = usageMap.get(b.id) ?? 0;
      if (ub !== ua) return ub - ua;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  return prisma.catalogModel.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const findById = (id: string) =>
  prisma.catalogModel.findUnique({ where: { id } });

export const countActive = () =>
  prisma.catalogModel.count({ where: { isActive: true } });

export const countWithFilter = (filter: ListFilter = {}) =>
  prisma.catalogModel.count({ where: buildWhere(filter) });

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
