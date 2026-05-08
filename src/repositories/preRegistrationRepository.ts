import { prisma } from "../lib/prisma";

type CreatePreRegistrationData = {
  email: string;
  phone?: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  source?: string;
};

export const findByEmail = (email: string) =>
  prisma.preRegistration.findUnique({ where: { email } });

export const create = (data: CreatePreRegistrationData) =>
  prisma.preRegistration.create({
    data: {
      email: data.email,
      phone: data.phone,
      privacyAgreed: data.privacyAgreed,
      marketingAgreed: data.marketingAgreed,
      source: data.source ?? "signup_waitlist",
    },
  });
