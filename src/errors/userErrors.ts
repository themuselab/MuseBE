import { createAppError } from "./appError";

export const userErrors = {
  notFound: () =>
    createAppError("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", 404),
  validationError: (message: string) =>
    createAppError("USER_VALIDATION", message, 400),
  unauthorized: () =>
    createAppError("USER_UNAUTHORIZED", "인증이 필요합니다", 401),
};
