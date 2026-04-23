import { createAppError } from "./appError";

export const authErrors = {
  invalidCredentials: () =>
    createAppError("AUTH_INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다", 401),
  emailExists: () =>
    createAppError("AUTH_EMAIL_EXISTS", "이미 사용 중인 이메일입니다", 409),
  tokenExpired: () =>
    createAppError("AUTH_TOKEN_EXPIRED", "토큰이 만료되었습니다", 401),
  tokenInvalid: () =>
    createAppError("AUTH_TOKEN_INVALID", "유효하지 않은 토큰입니다", 401),
  refreshExpired: () =>
    createAppError("AUTH_REFRESH_EXPIRED", "리프레시 토큰이 만료되었습니다", 401),
  googleInvalid: () =>
    createAppError("AUTH_GOOGLE_INVALID", "Google 인증에 실패했습니다", 401),
  codeExpired: () =>
    createAppError("AUTH_CODE_EXPIRED", "인증 코드가 만료되었거나 존재하지 않습니다", 401),
  stateMismatch: () =>
    createAppError("AUTH_STATE_MISMATCH", "OAuth state가 일치하지 않습니다", 403),
  validationError: (message: string) =>
    createAppError("VALIDATION_ERROR", message, 400),
};
