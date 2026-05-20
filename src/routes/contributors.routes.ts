import { Router } from "express";
import {
  getContributors,
  refresh,
} from "../controllers/contributors.controller";
import auth from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getContributors);
router.post("/refresh", auth.requireAdmin, refresh);

export default router;
