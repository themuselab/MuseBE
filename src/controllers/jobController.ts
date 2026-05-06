import { Request, Response, NextFunction } from "express";
import path from "node:path";
import * as jobService from "../services/jobService";
import { generateAdSchema, listJobsQuerySchema, reOverlaySchema } from "./ads.validation";
import { createSuccessResponse } from "../types/api";
import { adErrors } from "../errors/adErrors";
import { userErrors } from "../errors/userErrors";
import { getPublicUrl } from "../lib/localStorage";

const parse = <T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
): T => {
  try {
    return schema.parse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "입력값이 올바르지 않습니다";
    throw adErrors.validationError(message);
  }
};

export const handleUploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();

    const file = req.file;
    if (!file) throw adErrors.productImageRequired();

    const productRel = path
      .relative(path.resolve(__dirname, "../../uploads"), file.path)
      .split(path.sep)
      .join("/");
    const productImagePath = getPublicUrl(productRel);

    res.status(201).json(
      createSuccessResponse({
        productImagePath,
        filename: file.originalname,
        size: file.size,
      }),
    );
  } catch (err) {
    next(err);
  }
};

export const handleGenerateAd = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();

    const dto = parse(generateAdSchema, req.body);

    const result = await jobService.createJob({
      userId,
      catalogModelId: dto.catalogModelId,
      prompt: dto.prompt,
      headline: dto.headline,
      subhead: dto.subhead,
      industry: dto.industry,
      item: dto.item,
      extraDescription: dto.extraDescription,
      mood: dto.mood,
      productImagePath: dto.productImagePath,
    });

    res.status(202).json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};

export const handleGetJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();
    const id = req.params.id;
    if (!id || Array.isArray(id)) throw adErrors.jobNotFound();
    const job = await jobService.getJobForUser(id, userId);
    res.json(createSuccessResponse(job));
  } catch (err) {
    next(err);
  }
};

export const handleListMyJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();
    const dto = parse(listJobsQuerySchema, req.query);
    const result = await jobService.listMyJobs({
      userId,
      status: dto.status,
      cursor: dto.cursor,
      limit: dto.limit,
    });
    res.json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};

export const handleReOverlayText = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw userErrors.unauthorized();
    const id = req.params.id;
    if (!id || Array.isArray(id)) throw adErrors.jobNotFound();
    const dto = parse(reOverlaySchema, req.body);
    const result = await jobService.reOverlayText({
      jobId: id,
      userId,
      headline: dto.headline,
      subhead: dto.subhead,
      cta: dto.cta,
    });
    res.json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};
