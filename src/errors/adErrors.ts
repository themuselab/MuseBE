import { createAppError } from "./appError";

export const adErrors = {
  jobNotFound: () =>
    createAppError("AD_JOB_NOT_FOUND", "광고 작업을 찾을 수 없습니다", 404),
  jobForbidden: () =>
    createAppError("AD_JOB_FORBIDDEN", "해당 광고 작업에 접근 권한이 없습니다", 403),
  productImageRequired: () =>
    createAppError(
      "AD_PRODUCT_IMAGE_REQUIRED",
      "제품 이미지를 첨부해야 합니다",
      400,
    ),
  catalogModelNotFound: () =>
    createAppError(
      "AD_CATALOG_MODEL_NOT_FOUND",
      "선택한 카탈로그 모델을 찾을 수 없습니다",
      404,
    ),
  validationError: (message: string) =>
    createAppError("AD_VALIDATION", message, 400),
  falFailed: (detail?: string) =>
    createAppError(
      "AD_FAL_FAILED",
      `이미지 생성 단계에서 실패했습니다${detail ? `: ${detail}` : ""}`,
      502,
    ),
  openaiBlocked: () =>
    createAppError(
      "AD_OPENAI_BLOCKED",
      "프롬프트가 정책에 의해 차단되었습니다. 입력을 수정해 주세요",
      400,
    ),
  pilFailed: (detail?: string) =>
    createAppError(
      "AD_PIL_FAILED",
      `한글 카피 합성에 실패했습니다${detail ? `: ${detail}` : ""}`,
      502,
    ),
};
