import { Router } from "express";
import contributorController from "../controllers/contributor.controller";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const router = Router();

router.get("/", publicRateLimit, contributorController.findAllContributors);

export default router;
