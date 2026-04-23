import * as userRepository from "../repositories/userRepository";
import { userErrors } from "../errors/userErrors";

export type UserMeResponse = {
  id: string;
  email: string;
  userType: string;
  ageGroup: string | null;
  business: {
    industryMain: string;
    industrySub: string | null;
    businessName: string | null;
    businessDuration: string | null;
  } | null;
};

type UserWithBusiness = Awaited<ReturnType<typeof userRepository.findById>>;

const toUserMeResponse = (user: NonNullable<UserWithBusiness>): UserMeResponse => ({
  id: user.id,
  email: user.email,
  userType: user.userType,
  ageGroup: user.ageGroup,
  business: user.businessInfo
    ? {
        industryMain: user.businessInfo.industryMain,
        industrySub: user.businessInfo.industrySub,
        businessName: user.businessInfo.businessName,
        businessDuration: user.businessInfo.businessDuration,
      }
    : null,
});

export const getMe = async (userId: string): Promise<UserMeResponse> => {
  const user = await userRepository.findById(userId);
  if (!user) throw userErrors.notFound();
  return toUserMeResponse(user);
};

export type PatchMeInput = {
  ageGroup?: string;
  business?: {
    industryMain?: string;
    businessName?: string;
    businessDuration?: string;
  };
};

export const patchMe = async (userId: string, input: PatchMeInput): Promise<UserMeResponse> => {
  const existing = await userRepository.findById(userId);
  if (!existing) throw userErrors.notFound();

  await userRepository.updateUser(userId, input);
  const updated = await userRepository.findById(userId);
  if (!updated) throw userErrors.notFound();
  return toUserMeResponse(updated);
};
