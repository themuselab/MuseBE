import { Request, Response, NextFunction } from "express";
import * as usersService from "../services/usersService";
import { patchMeSchema } from "./users.validation";
import { createSuccessResponse } from "../types/api";
import { userErrors } from "../errors/userErrors";

const parseBody = <T>(schema: { parse: (data: unknown) => T }, body: unknown): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "입력값이 올바르지 않습니다";
    throw userErrors.validationError(message);
  }
};

export const handleGetMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();
    const user = await usersService.getMe(userId);
    res.json(createSuccessResponse(user));
  } catch (err) {
    next(err);
  }
};

export const handlePatchMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();
    const dto = parseBody(patchMeSchema, req.body);
    const user = await usersService.patchMe(userId, dto);
    res.json(createSuccessResponse(user));
  } catch (err) {
    next(err);
  }
};
