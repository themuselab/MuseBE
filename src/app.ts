import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// routes 등록은 여기에 추가

app.use(errorHandler);

export { app };
