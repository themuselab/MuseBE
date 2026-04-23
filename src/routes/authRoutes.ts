import { Router } from "express";
import {
  handleSignup,
  handleLogin,
  handleGoogleRedirect,
  handleGoogleCallback,
  handleGooglePending,
  handleGoogleSignup,
  handleExchange,
  handleRefresh,
  handleLogout,
  handleCheckEmail,
  handleMe,
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { loginLimiter, signupLimiter, checkEmailLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/signup", signupLimiter, handleSignup);
router.post("/login", loginLimiter, handleLogin);
router.get("/google", handleGoogleRedirect);
router.get("/google/callback", handleGoogleCallback);
router.get("/google/pending", handleGooglePending);
router.post("/google/signup", signupLimiter, handleGoogleSignup);
router.post("/exchange", handleExchange);
router.post("/refresh", handleRefresh);
router.post("/logout", authMiddleware, handleLogout);
router.post("/check-email", checkEmailLimiter, handleCheckEmail);
router.get("/me", authMiddleware, handleMe);

export { router as authRouter };
