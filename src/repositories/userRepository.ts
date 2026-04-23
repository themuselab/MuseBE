import { prisma } from "../lib/prisma";

type CreateUserData = {
  email: string;
  password?: string;
  provider?: string;
  providerId?: string;
  userType: string;
  ageGroup: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  overseasAgreed: boolean;
  adidAgreed: boolean;
  business: {
    industryMain: string;
    industrySub?: string;
    businessName?: string;
    businessDuration?: string;
  };
};

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    include: { businessInfo: true },
  });

export const findByProviderId = (provider: string, providerId: string) =>
  prisma.user.findUnique({
    where: { provider_providerId: { provider, providerId } },
  });

export const emailExists = async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user !== null;
};

export const createUser = (data: CreateUserData) =>
  prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      provider: data.provider ?? "email",
      providerId: data.providerId,
      userType: data.userType,
      ageGroup: data.ageGroup,
      termsAgreed: data.termsAgreed,
      privacyAgreed: data.privacyAgreed,
      overseasAgreed: data.overseasAgreed,
      adidAgreed: data.adidAgreed,
      businessInfo: {
        create: {
          industryMain: data.business.industryMain,
          industrySub: data.business.industrySub,
          businessName: data.business.businessName,
          businessDuration: data.business.businessDuration,
        },
      },
    },
  });

type UpdateUserData = {
  ageGroup?: string;
  business?: {
    industryMain?: string;
    businessName?: string;
    businessDuration?: string;
  };
};

export const updateUser = (id: string, data: UpdateUserData) => {
  const userUpdate: { ageGroup?: string } = {};
  if (data.ageGroup !== undefined) userUpdate.ageGroup = data.ageGroup;

  const businessUpdate = data.business
    ? {
        ...(data.business.industryMain !== undefined && { industryMain: data.business.industryMain }),
        ...(data.business.businessName !== undefined && { businessName: data.business.businessName }),
        ...(data.business.businessDuration !== undefined && { businessDuration: data.business.businessDuration }),
      }
    : null;

  return prisma.user.update({
    where: { id },
    data: {
      ...userUpdate,
      ...(businessUpdate && Object.keys(businessUpdate).length > 0
        ? {
            businessInfo: {
              upsert: {
                create: {
                  industryMain: businessUpdate.industryMain ?? "",
                  businessName: businessUpdate.businessName,
                  businessDuration: businessUpdate.businessDuration,
                },
                update: businessUpdate,
              },
            },
          }
        : {}),
    },
    include: { businessInfo: true },
  });
};
