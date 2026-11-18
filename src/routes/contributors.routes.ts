import { Router } from "express";
import {
  getContributors,
  refresh,
} from "../controllers/contributors.controller";
import { requireAdminWrite } from "../middlewares/admin-auth.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/", publicRateLimit, getContributors);
router.post("/refresh", ...requireAdminWrite, refresh);

export default router;
