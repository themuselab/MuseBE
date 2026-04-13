import { prisma } from "../lib/prisma";

export const create = (code: string, userId: string, refreshToken: string, expiresAt: Date) =>
  prisma.tempAuthCode.create({
    data: { code, userId, refreshToken, expiresAt },
  });

export const findByCode = (code: string) =>
  prisma.tempAuthCode.findUnique({ where: { code } });

export const deleteByCode = (code: string) =>
  prisma.tempAuthCode.delete({ where: { code } });

export const deleteExpired = () =>
  prisma.tempAuthCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
