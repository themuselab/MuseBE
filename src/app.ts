import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler";
import { authRouter } from "./routes/authRoutes";
import { preRegistrationRouter } from "./routes/preRegistrationRoutes";
import { usersRouter } from "./routes/usersRoutes";

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

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/pre-registration", preRegistrationRouter);

app.use(errorHandler);

export { app };
