import { Router } from "express";
import statsController from "../controllers/stats.controller";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/", publicRateLimit, statsController.getStats);

export default router;
