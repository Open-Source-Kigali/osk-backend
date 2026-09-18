import type { NextFunction, Response, Request } from "express";
import { env } from "../config/env";
import response from "../utils/response";
import { authAttemptRateLimit, runLimiter } from "./rate-limit.middleware";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header("x-api-key");

  if (!env.adminApiKey) {
    return response.failure(res, "Server admin key not configured", 500);
  }
  if (apiKey !== env.adminApiKey) {
    await runLimiter(authAttemptRateLimit, req, res);
    if (!res.headersSent) {
      return response.failure(res, "Admin access required", 403);
    }
    return;
  }
  next();
}

export default {
  requireAdmin,
};
