import type { NextFunction, Response, Request } from "express";
import { env } from "../config/env";
import response from "../utils/response";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];

  if (!env.adminApiKey) {
    return response.failure(res, "Server admin key not configured", 500);
  }
  if (apiKey !== env.adminApiKey) {
    return response.failure(res, "Admin access required", 403);
  }
  next();
}

export default {
  requireAdmin,
};
