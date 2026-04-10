import { Request, Response, NextFunction } from "express";
import { isAppError } from "../errors/appError";
import { createErrorResponse } from "../types/api";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (isAppError(err)) {
    res.status(err.statusCode).json(createErrorResponse(err.code, err.message));
    return;
  }

  console.error("Unhandled error:", err);
  res
    .status(500)
    .json(createErrorResponse("INTERNAL_001", "서버 오류가 발생했습니다"));
};
