import { z } from "zod/v4";

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const termsSchema = z.object({
  service: z.literal(true, { error: "서비스 이용약관에 동의해야 합니다" }),
  privacy: z.literal(true, { error: "개인정보 수집 및 이용에 동의해야 합니다" }),
  overseas: z.literal(true, { error: "개인정보의 국외 이전에 동의해야 합니다" }),
  adid: z.boolean(),
});

const businessSchema = z.object({
  industryMain: z.string().min(1, "업종을 선택해야 합니다"),
  industrySub: z.string().optional(),
  businessName: z.string().optional(),
  businessDuration: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export const signupSchema = z.object({
  email: z.email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().regex(PASSWORD_REGEX, "비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다"),
  userType: z.literal("advertiser"),
  ageGroup: z.enum(["20s", "30s", "40s", "50s", "60s_plus"]),
  terms: termsSchema,
  business: businessSchema,
});

export const googleSignupSchema = z.object({
  pendingCode: z.string().min(1),
  userType: z.literal("advertiser"),
  ageGroup: z.enum(["20s", "30s", "40s", "50s", "60s_plus"]),
  terms: termsSchema,
  business: businessSchema,
});

export const checkEmailSchema = z.object({
  email: z.email("유효한 이메일 주소를 입력해주세요"),
});

export const exchangeSchema = z.object({
  code: z.string().min(1),
});
