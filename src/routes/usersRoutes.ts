import { Router } from "express";
import { handleGetMe, handlePatchMe } from "../controllers/usersController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", authMiddleware, handleGetMe);
router.patch("/me", authMiddleware, handlePatchMe);

export { router as usersRouter };
