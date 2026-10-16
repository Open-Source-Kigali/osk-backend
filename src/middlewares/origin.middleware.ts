import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import response from "../utils/response";

function getRequestOrigin(req: Request): string | undefined {
  const origin = req.get("origin");
  if (origin) return origin;

  const referer = req.get("referer");
  if (!referer) return undefined;

  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/**
 * Rejects credentialed auth mutations from untrusted browser origins.
 * CORS alone is not treated as CSRF protection.
 */
export function requireTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (env.corsOrigins.length === 0) {
    return response.failure(res, "Trusted origins are not configured", 500);
  }

  if (env.corsOrigins.includes("*")) {
    return response.failure(res, "Trusted origins are misconfigured", 500);
  }

  const origin = getRequestOrigin(req);
  if (!origin || !env.corsOrigins.includes(origin)) {
    return response.failure(res, "Origin not allowed", 403);
  }

  return next();
}
