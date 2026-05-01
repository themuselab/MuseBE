import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middlewares/errorHandler";
import { authMiddleware } from "./middlewares/authMiddleware";
import { authRouter } from "./routes/authRoutes";
import { preRegistrationRouter } from "./routes/preRegistrationRoutes";
import { usersRouter } from "./routes/usersRoutes";
import { catalogModelRouter } from "./routes/catalogModelRoutes";
import { adRouter } from "./routes/adRoutes";
import { swaggerDocument } from "./docs/swagger";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/pre-registration", preRegistrationRouter);
app.use("/catalog-models", catalogModelRouter);
app.use("/ads", adRouter);

// 정적 업로드 파일 — 인증 가드 + 본인 폴더만
const uploadsRoot = path.resolve(__dirname, "../uploads");

const ownsRequestedPath = (req: Request, userId: string): boolean => {
  // /uploads/<category>/<userId>/... 형태만 허용 (catalog는 공용)
  const segments = req.path.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  const [category, owner] = segments;
  if (category === "catalog") return true;
  return owner === userId;
};

app.use(
  "/uploads",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).end();
    if (!ownsRequestedPath(req, userId)) return res.status(403).end();
    next();
  },
  express.static(uploadsRoot),
);

app.use(errorHandler);

export { app };
