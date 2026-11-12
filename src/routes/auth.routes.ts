import { Router } from "express";
import authController from "../controllers/auth.controller";
import { requireTrustedOrigin } from "../middlewares/origin.middleware";
import { requireAdminSession } from "../middlewares/session.middleware";
import { requireCsrf } from "../middlewares/csrf.middleware";
import {
  createRateLimiter,
  publicKeyGenerator,
} from "../middlewares/rate-limit.middleware";

const router = Router();

/** Caps total login POSTs per IP so failed-attempt limiting cannot be the only control. */
const loginRateLimit = createRateLimiter({
  limit: 30,
  prefix: "login",
  keyGenerator: publicKeyGenerator,
});

router.post(
  "/login",
  loginRateLimit,
  requireTrustedOrigin,
  authController.login,
);

router.get("/me", requireAdminSession, authController.me);

router.get("/csrf", requireAdminSession, authController.csrf);

router.post(
  "/logout",
  requireTrustedOrigin,
  requireAdminSession,
  requireCsrf,
  authController.logout,
);

export default router;
