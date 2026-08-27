import { Router } from "express";
import {
  getContributors,
  refresh,
} from "../controllers/contributors.controller";
import auth from "../middlewares/auth.middleware";
import {
  adminRateLimit,
  publicRateLimit,
} from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/", publicRateLimit, getContributors);
router.post("/refresh", auth.requireAdmin, adminRateLimit, refresh);

export default router;
