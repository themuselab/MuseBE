import { Router } from "express";
import {
  handleGenerateAd,
  handleGetJob,
  handleListMyJobs,
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

export { router as adRouter };
