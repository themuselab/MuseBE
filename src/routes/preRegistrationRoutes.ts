import { Router } from "express";
import { handleSubmit } from "../controllers/preRegistrationController";

const router = Router();

router.post("/", handleSubmit);

export { router as preRegistrationRouter };
