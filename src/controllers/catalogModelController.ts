import { Request, Response, NextFunction } from "express";
import * as catalogModelService from "../services/catalogModelService";
import { listCatalogModelsQuerySchema } from "./catalogModels.validation";
import { createSuccessResponse } from "../types/api";
import { adErrors } from "../errors/adErrors";

const parseQuery = <T>(
  schema: { parse: (data: unknown) => T },
  query: unknown,
): T => {
  try {
    return schema.parse(query);
  } catch (err) {
    const message = err instanceof Error ? err.message : "쿼리가 올바르지 않습니다";
    throw adErrors.validationError(message);
  }
};

export const handleListCatalogModels = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = parseQuery(listCatalogModelsQuerySchema, req.query);
    const items = await catalogModelService.listCatalog(dto);
    const total = await catalogModelService.getTotalCount();
    res.json(createSuccessResponse({ items, total }));
  } catch (err) {
    next(err);
  }
};

export const handleListTopCatalogModels = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const items = await catalogModelService.listTop(5);
    res.json(createSuccessResponse({ items }));
  } catch (err) {
    next(err);
  }
};
