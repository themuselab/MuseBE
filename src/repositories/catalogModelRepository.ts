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
