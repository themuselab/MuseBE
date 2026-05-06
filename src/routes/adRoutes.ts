import { Router } from "express";
import {
  handleDeleteJob,
  handleDownloadJob,
  handleGenerateAd,
  handleGetJob,
  handleListMyJobs,
  handleReOverlayText,
  handleUploadProductImage,
} from "../controllers/jobController";
import { handleRecommendMoods } from "../controllers/moodController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { productImageUpload } from "../middlewares/productImageUpload";

const router = Router();

router.post("/moods", authMiddleware, handleRecommendMoods);

router.post(
  "/products",
  authMiddleware,
  productImageUpload.single("productImage"),
  handleUploadProductImage,
);

router.post("/generate", authMiddleware, handleGenerateAd);

router.get("/jobs", authMiddleware, handleListMyJobs);
router.get("/jobs/:id", authMiddleware, handleGetJob);
router.delete("/jobs/:id", authMiddleware, handleDeleteJob);
router.get("/jobs/:id/download", authMiddleware, handleDownloadJob);

// 텍스트 재편집 — GPT 재호출 없이 PIL만 다시 호출 (흰디 패턴)
router.post("/jobs/:id/re-overlay", authMiddleware, handleReOverlayText);

export { router as adRouter };
