import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { code: "RATE_LIMIT", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
  },
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { code: "RATE_LIMIT", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
  },
});

export const checkEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { code: "RATE_LIMIT", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
  },
});
