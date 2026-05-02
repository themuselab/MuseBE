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

// 정적 업로드 파일
const uploadsRoot = path.resolve(__dirname, "../uploads");

// 카탈로그는 공개 (모든 로그인 회원이 보는 공용 자산 — 브라우저 <img> 직접 표시 위해 비인증)
app.use("/uploads/catalog", express.static(path.join(uploadsRoot, "catalog")));

// 그 외 (products / ads / intermediate) — 인증 + 본인 폴더만
const ownsRequestedPath = (req: Request, userId: string): boolean => {
  // path = "/<userId>/..." (앞 카테고리는 라우트 prefix로 이미 소비됨)
  const segments = req.path.split("/").filter(Boolean);
  if (segments.length < 1) return false;
  const owner = segments[0];
  return owner === userId;
};

const authedStaticGuard = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).end();
  if (!ownsRequestedPath(req, userId)) return res.status(403).end();
  next();
};

for (const folder of ["products", "ads", "intermediate"]) {
  app.use(
    `/uploads/${folder}`,
    authMiddleware,
    authedStaticGuard,
    express.static(path.join(uploadsRoot, folder)),
  );
}

app.use(errorHandler);

export { app };
