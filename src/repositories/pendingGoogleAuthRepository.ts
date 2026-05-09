import { prisma } from "../lib/prisma";

export const create = (code: string, email: string, googleId: string, expiresAt: Date) =>
  prisma.pendingGoogleAuth.create({
    data: { code, email, googleId, expiresAt },
  });

export const findByCode = (code: string) =>
  prisma.pendingGoogleAuth.findUnique({ where: { code } });

export const deleteByCode = (code: string) =>
  prisma.pendingGoogleAuth.delete({ where: { code } });

export const deleteByGoogleId = (googleId: string) =>
  prisma.pendingGoogleAuth.deleteMany({ where: { googleId } });

export const deleteExpired = () =>
  prisma.pendingGoogleAuth.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
