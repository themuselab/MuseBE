import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Request } from "express";

const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads/products");

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    const userId = req.user?.userId;
    if (!userId) return cb(new Error("unauthorized upload"), "");
    const dir = path.join(UPLOAD_ROOT, userId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const hash = crypto.randomUUID();
    cb(null, `${hash}${ext}`);
  },
});

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

export const productImageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new Error("png/jpeg/webp 이미지만 업로드 가능합니다"));
      return;
    }
    cb(null, true);
  },
});
