import { Router } from "express";
import {
  getContributors,
  refresh,
} from "../controllers/contributors.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getContributors);
router.post("/refresh", authMiddleware.requireAdmin, refresh);

export default router;
