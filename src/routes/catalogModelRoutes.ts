import { Router } from "express";
import { handleListCatalogModels } from "../controllers/catalogModelController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, handleListCatalogModels);

export { router as catalogModelRouter };
