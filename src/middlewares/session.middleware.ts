import type { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";
import response from "../utils/response";
import { readCookie, SESSION_COOKIE_NAME } from "../utils/cookies";

export async function requireAdminSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME);
    if (!token) {
      return response.failure(res, "Authentication required", 401);
    }

    const active = await authService.getSessionUser(token);
    if (!active) {
      return response.failure(res, "Authentication required", 401);
    }

    req.authUser = active.user;
    req.authSession = active.session;
    return next();
  } catch (err) {
    return next(err);
  }
}
