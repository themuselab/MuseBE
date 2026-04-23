import { Request, Response, NextFunction } from "express";
import * as preRegistrationService from "../services/preRegistrationService";
import { preRegistrationSchema } from "./preRegistration.validation";
import { createSuccessResponse } from "../types/api";
import { preRegistrationErrors } from "../errors/preRegistrationErrors";

const parseBody = <T>(
  schema: { parse: (data: unknown) => T },
  body: unknown,
): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "입력값이 올바르지 않습니다";
    throw preRegistrationErrors.validationError(message);
  }
};

export const handleSubmit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = parseBody(preRegistrationSchema, req.body);
    const result = await preRegistrationService.submit(data);
    res.status(201).json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};
