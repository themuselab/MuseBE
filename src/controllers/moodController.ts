import { Request, Response, NextFunction } from "express";
import * as moodService from "../services/moodService";
import { moodRequestSchema } from "./ads.validation";
import { createSuccessResponse } from "../types/api";
import { adErrors } from "../errors/adErrors";

const parseBody = <T>(
  schema: { parse: (data: unknown) => T },
  body: unknown,
): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "입력값이 올바르지 않습니다";
    throw adErrors.validationError(message);
  }
};

export const handleRecommendMoods = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = parseBody(moodRequestSchema, req.body);
    const result = await moodService.getMoodRecommendations(dto);
    res.json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};
