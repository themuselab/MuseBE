import bcrypt from "bcrypt";
import crypto from "crypto";
import * as userRepository from "../repositories/userRepository";
import * as refreshTokenRepository from "../repositories/refreshTokenRepository";
import * as pendingGoogleAuthRepository from "../repositories/pendingGoogleAuthRepository";
import * as tempAuthCodeRepository from "../repositories/tempAuthCodeRepository";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { exchangeGoogleCode, getGoogleAuthUrl } from "../lib/google";
import { authErrors } from "../errors/authErrors";

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_DAYS = 7;
const TEMP_CODE_SECONDS = 30;
const PENDING_GOOGLE_MINUTES = 30;

const generateRandomCode = (): string => crypto.randomBytes(32).toString("hex");

const createRefreshTokenExpiry = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_DAYS);
  return date;
};

type SignupData = {
  email: string;
  password: string;
  userType: string;
  ageGroup: string;
  terms: {
    service: boolean;
    privacy: boolean;
    overseas: boolean;
    adid: boolean;
  };
  business: {
    industryMain: string;
    industrySub?: string;
    businessName?: string;
    businessDuration?: string;
  };
};

type UserResponse = {
  id: string;
  email: string;
  userType: string;
  ageGroup: string | null;
};

const toUserResponse = (user: { id: string; email: string; userType: string; ageGroup: string | null }): UserResponse => ({
  id: user.id,
  email: user.email,
  userType: user.userType,
  ageGroup: user.ageGroup,
});

export const signup = async (data: SignupData): Promise<{ userId: string }> => {
  const exists = await userRepository.emailExists(data.email);
  if (exists) {
    throw authErrors.emailExists();
  }

  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await userRepository.createUser({
    email: data.email,
    password: hashedPassword,
    userType: data.userType,
    ageGroup: data.ageGroup,
    termsAgreed: data.terms.service,
    privacyAgreed: data.terms.privacy,
    overseasAgreed: data.terms.overseas,
    adidAgreed: data.terms.adid,
    business: data.business,
  });

  return { userId: user.id };
};

export const login = async (email: string, password: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.password) {
    throw authErrors.invalidCredentials();
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw authErrors.invalidCredentials();
  }

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });
  await refreshTokenRepository.create(user.id, refreshToken, createRefreshTokenExpiry());

  return {
    accessToken,
    refreshToken,
    user: toUserResponse(user),
  };
};

export const getGoogleRedirectUrl = (state: string): string => getGoogleAuthUrl(state);

export const handleGoogleCallback = async (code: string) => {
  const googleUser = await exchangeGoogleCode(code).catch(() => {
    throw authErrors.googleInvalid();
  });

  const existingUser = await userRepository.findByProviderId("google", googleUser.googleId);

  if (existingUser) {
    const accessToken = generateAccessToken({ userId: existingUser.id });
    const refreshToken = generateRefreshToken({ userId: existingUser.id });
    await refreshTokenRepository.create(existingUser.id, refreshToken, createRefreshTokenExpiry());

    const tempCode = generateRandomCode();
    const expiresAt = new Date(Date.now() + TEMP_CODE_SECONDS * 1000);
    await tempAuthCodeRepository.create(tempCode, existingUser.id, refreshToken, expiresAt);

    return { type: "login" as const, tempCode, refreshToken };
  }

  const tempCode = generateRandomCode();
  const expiresAt = new Date(Date.now() + PENDING_GOOGLE_MINUTES * 60 * 1000);
  await pendingGoogleAuthRepository.deleteByGoogleId(googleUser.googleId);
  await pendingGoogleAuthRepository.create(tempCode, googleUser.email, googleUser.googleId, expiresAt);

  return { type: "signup" as const, pendingCode: tempCode };
};

export const getGooglePendingEmail = async (code: string): Promise<string> => {
  const pending = await pendingGoogleAuthRepository.findByCode(code);
  if (!pending || pending.expiresAt < new Date()) {
    if (pending) await pendingGoogleAuthRepository.deleteByCode(code);
    throw authErrors.codeExpired();
  }
  return pending.email;
};

type GoogleSignupData = {
  pendingCode: string;
  userType: string;
  ageGroup: string;
  terms: {
    service: boolean;
    privacy: boolean;
    overseas: boolean;
    adid: boolean;
  };
  business: {
    industryMain: string;
    industrySub?: string;
    businessName?: string;
    businessDuration?: string;
  };
};

export const googleSignup = async (data: GoogleSignupData) => {
  const pending = await pendingGoogleAuthRepository.findByCode(data.pendingCode);
  if (!pending || pending.expiresAt < new Date()) {
    if (pending) await pendingGoogleAuthRepository.deleteByCode(data.pendingCode);
    throw authErrors.codeExpired();
  }

  const exists = await userRepository.emailExists(pending.email);
  if (exists) {
    await pendingGoogleAuthRepository.deleteByCode(data.pendingCode);
    throw authErrors.emailExists();
  }

  const user = await userRepository.createUser({
    email: pending.email,
    provider: "google",
    providerId: pending.googleId,
    userType: data.userType,
    ageGroup: data.ageGroup,
    termsAgreed: data.terms.service,
    privacyAgreed: data.terms.privacy,
    overseasAgreed: data.terms.overseas,
    adidAgreed: data.terms.adid,
    business: data.business,
  });

  await pendingGoogleAuthRepository.deleteByCode(data.pendingCode);

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });
  await refreshTokenRepository.create(user.id, refreshToken, createRefreshTokenExpiry());

  return {
    accessToken,
    refreshToken,
    user: toUserResponse(user),
  };
};

export const exchangeCode = async (code: string) => {
  const tempAuth = await tempAuthCodeRepository.findByCode(code);
  if (!tempAuth || tempAuth.expiresAt < new Date()) {
    if (tempAuth) await tempAuthCodeRepository.deleteByCode(code);
    throw authErrors.codeExpired();
  }

  const user = await userRepository.findById(tempAuth.userId);
  if (!user) {
    await tempAuthCodeRepository.deleteByCode(code);
    throw authErrors.tokenInvalid();
  }

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = tempAuth.refreshToken;

  await tempAuthCodeRepository.deleteByCode(code);

  return {
    accessToken,
    refreshToken,
    user: toUserResponse(user),
  };
};

export const refreshAccessToken = async (token: string) => {
  const storedToken = await refreshTokenRepository.findByToken(token);
  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) await refreshTokenRepository.deleteByToken(token);
    throw authErrors.refreshExpired();
  }

  try {
    verifyRefreshToken(token);
  } catch {
    await refreshTokenRepository.deleteByToken(token);
    throw authErrors.refreshExpired();
  }

  const accessToken = generateAccessToken({ userId: storedToken.userId });
  return { accessToken };
};

export const logout = async (token: string) => {
  try {
    await refreshTokenRepository.deleteByToken(token);
  } catch {
    // 토큰이 이미 삭제된 경우 무시
  }
};

export const checkEmail = async (email: string) => {
  const exists = await userRepository.emailExists(email);
  return { available: !exists };
};

export const getCurrentUser = async (userId: string) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw authErrors.tokenInvalid();
  }
  return toUserResponse(user);
};
