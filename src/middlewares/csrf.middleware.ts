import type { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";
import response from "../utils/response";
import { readCookie, SESSION_COOKIE_NAME } from "../utils/cookies";

export const CSRF_HEADER = "x-csrf-token";

/**
 * Validates the session-bound CSRF token from the X-CSRF-Token header.
 * Apply this to authenticated cookie-based state-changing routes (Phase 2:
 * logout; Phase 3: admin mutations that switch from the API key).
 */
export async function requireCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    const csrfToken = req.get(CSRF_HEADER);

    if (!sessionToken || !csrfToken) {
      return response.failure(res, "CSRF token required", 403);
    }

    const valid = await authService.verifyCsrfToken(sessionToken, csrfToken);
    if (!valid) {
      return response.failure(res, "Invalid CSRF token", 403);
    }

    return next();
  } catch (err) {
    return next(err);
  }
}
