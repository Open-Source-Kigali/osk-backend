import type { RequestHandler } from "express";
import { requireTrustedOrigin } from "./origin.middleware";
import { requireAdminSession } from "./session.middleware";
import { requireCsrf } from "./csrf.middleware";
import { adminRateLimit } from "./rate-limit.middleware";

/**
 * Admin read-only protection: valid ADMIN session required.
 * CSRF is not required for safe GET requests.
 */
export const requireAdminRead: RequestHandler[] = [
  requireAdminSession,
  adminRateLimit,
];

/**
 * Admin state-changing protection.
 * Order: trusted Origin → session → CSRF → rate limit → controller.
 */
export const requireAdminWrite: RequestHandler[] = [
  requireTrustedOrigin,
  requireAdminSession,
  requireCsrf,
  adminRateLimit,
];
