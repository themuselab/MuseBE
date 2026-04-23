import { z } from "zod/v4";

const KOREAN_PHONE_REGEX = /^01[016789]-?\d{3,4}-?\d{4}$/;

export const preRegistrationSchema = z.object({
  email: z.email("유효한 이메일 주소를 입력해주세요"),
  phone: z
    .string()
    .regex(KOREAN_PHONE_REGEX, "유효한 휴대전화 번호를 입력해주세요")
    .optional(),
  privacyAgreed: z.literal(true, {
    error: "개인정보 수집 및 이용에 동의해야 합니다",
  }),
  marketingAgreed: z.boolean(),
});
