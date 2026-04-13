import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { authErrors } from "../errors/authErrors";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(authErrors.tokenInvalid());
  }

  const token = authHeader.split(" ")[1] ?? "";

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      return next(authErrors.tokenExpired());
    }
    next(authErrors.tokenInvalid());
  }
};
