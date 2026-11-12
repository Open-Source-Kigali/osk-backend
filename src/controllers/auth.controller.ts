import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import authService from "../services/auth.service";
import { loginSchema } from "../schemas/auth.schema";
import { parseRequestBody } from "../utils/validation";
import response from "../utils/response";
import {
  clearSessionCookie,
  readCookie,
  SESSION_COOKIE_NAME,
  setSessionCookie,
} from "../utils/cookies";
import {
  loginFailureRateLimit,
  runLimiter,
} from "../middlewares/rate-limit.middleware";

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parseRequestBody(loginSchema, req.body, res);
    if (!body) return;

    await runLimiter(loginFailureRateLimit, req, res);
    if (res.headersSent) return;

    const result = await authService.login(body.email, body.password);
    if (!result.ok) {
      return response.failure(res, authService.INVALID_CREDENTIALS, 401);
    }

    setSessionCookie(res, result.sessionToken, env.sessionTtlSeconds);
    return response.success(res, result.payload, 200, "Logged in successfully");
  } catch (err) {
    next(err);
  }
}

async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.authUser || !req.authSession) {
      return response.failure(res, "Authentication required", 401);
    }

    return response.success(
      res,
      {
        user: req.authUser,
        expiresAt: req.authSession.expiresAt.toISOString(),
      },
      200,
      "Session retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function csrf(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    if (!sessionToken) {
      return response.failure(res, "Authentication required", 401);
    }

    const csrfToken = await authService.getCsrfToken(sessionToken);
    if (!csrfToken) {
      return response.failure(res, "Authentication required", 401);
    }

    return response.success(
      res,
      { csrfToken },
      200,
      "CSRF token issued successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    if (!sessionToken) {
      return response.failure(res, "Authentication required", 401);
    }

    const revoked = await authService.logout(sessionToken);
    clearSessionCookie(res);

    if (!revoked) {
      return response.failure(res, "Authentication required", 401);
    }

    return response.success(res, null, 200, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  login,
  me,
  csrf,
  logout,
};
