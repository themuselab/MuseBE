import { prisma } from "../lib/prisma";

export const create = (userId: string, token: string, expiresAt: Date) =>
  prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });

export const findByToken = (token: string) =>
  prisma.refreshToken.findUnique({ where: { token } });

export const deleteByToken = (token: string) =>
  prisma.refreshToken.delete({ where: { token } });

export const deleteAllByUserId = (userId: string) =>
  prisma.refreshToken.deleteMany({ where: { userId } });
