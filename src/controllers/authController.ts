import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import * as authService from "../services/authService";
import { loginSchema, signupSchema, googleSignupSchema, checkEmailSchema, exchangeSchema } from "./auth.validation";
import { createSuccessResponse } from "../types/api";
import { authErrors } from "../errors/authErrors";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production";
// FE/BE 동일 site(themuselab.kr 계열) 기준. lax는 same-site에서는 모든 메서드 허용 + cross-site GET 허용 (OAuth 콜백 호환).
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const parseBody = <T>(schema: { parse: (data: unknown) => T }, body: unknown): T => {
  try {
    return schema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "입력값이 올바르지 않습니다";
    throw authErrors.validationError(message);
  }
};

export const handleSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = parseBody(signupSchema, req.body);
    const result = await authService.signup(data);
    res.status(201).json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};

export const handleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = parseBody(loginSchema, req.body);
    const result = await authService.login(data.email, data.password);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.json(createSuccessResponse({
      accessToken: result.accessToken,
      user: result.user,
    }));
  } catch (err) {
    next(err);
  }
};

export const handleGoogleRedirect = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = crypto.randomBytes(32).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
    });
    const url = authService.getGoogleRedirectUrl(state);
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

export const handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.query;
    const storedState = req.cookies?.oauth_state;

    if (!state || !storedState || state !== storedState) {
      throw authErrors.stateMismatch();
    }

    res.clearCookie("oauth_state");

    if (typeof code !== "string") {
      throw authErrors.googleInvalid();
    }

    const result = await authService.handleGoogleCallback(code);

    if (result.type === "login") {
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
      res.redirect(`${FRONTEND_URL}/login?code=${result.tempCode}`);
    } else {
      res.redirect(`${FRONTEND_URL}/signup?pendingCode=${result.pendingCode}`);
    }
  } catch (err) {
    next(err);
  }
};

export const handleGooglePending = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code;
    if (typeof code !== "string") {
      throw authErrors.codeExpired();
    }
    const email = await authService.getGooglePendingEmail(code);
    res.json(createSuccessResponse({ email }));
  } catch (err) {
    next(err);
  }
};

export const handleGoogleSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = parseBody(googleSignupSchema, req.body);
    const result = await authService.googleSignup(data);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.status(201).json(createSuccessResponse({
      accessToken: result.accessToken,
      user: result.user,
    }));
  } catch (err) {
    next(err);
  }
};

export const handleExchange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = parseBody(exchangeSchema, req.body);
    const result = await authService.exchangeCode(data.code);
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    res.json(createSuccessResponse({
      accessToken: result.accessToken,
      user: result.user,
    }));
  } catch (err) {
    next(err);
  }
};

export const handleRefresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw authErrors.refreshExpired();
    }
    const result = await authService.refreshAccessToken(token);
    res.json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};

export const handleLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    // set 시점과 동일한 (sameSite, secure, path) 조합이어야 브라우저가 쿠키 삭제
    res.clearCookie("refreshToken", { path: "/auth", sameSite: "lax", secure: isProd });
    res.json(createSuccessResponse(null));
  } catch (err) {
    next(err);
  }
};

export const handleCheckEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = parseBody(checkEmailSchema, req.body);
    const result = await authService.checkEmail(data.email);
    res.json(createSuccessResponse(result));
  } catch (err) {
    next(err);
  }
};

export const handleMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw authErrors.tokenInvalid();
    }
    const user = await authService.getCurrentUser(userId);
    res.json(createSuccessResponse(user));
  } catch (err) {
    next(err);
  }
};
