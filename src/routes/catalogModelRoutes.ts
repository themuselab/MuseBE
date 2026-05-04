import { Router } from "express";
import {
  handleListCatalogModels,
  handleListTopCatalogModels,
} from "../controllers/catalogModelController";

const router = Router();

// 비회원도 카탈로그 조회 가능 — 응답이 user-specific 하지 않음 (기획서/16)
// /top이 /:id 같은 동적 라우트보다 먼저 등록되어야 함
router.get("/top", handleListTopCatalogModels);
router.get("/", handleListCatalogModels);

export { router as catalogModelRouter };
