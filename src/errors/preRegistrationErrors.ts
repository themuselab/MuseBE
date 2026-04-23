import { createAppError } from "./appError";

export const preRegistrationErrors = {
  emailExists: () =>
    createAppError(
      "PRE_REGISTRATION_EMAIL_EXISTS",
      "이미 사전 신청된 이메일입니다",
      409,
    ),
  validationError: (message: string) =>
    createAppError("VALIDATION_ERROR", message, 400),
};
