import { Router } from "express";
import {
  handleListCatalogModels,
  handleListTopCatalogModels,
} from "../controllers/catalogModelController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// /top이 /:id 같은 동적 라우트보다 먼저 등록되어야 함
router.get("/top", authMiddleware, handleListTopCatalogModels);
router.get("/", authMiddleware, handleListCatalogModels);

export { router as catalogModelRouter };
