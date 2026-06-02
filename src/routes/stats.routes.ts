import { Router } from "express";
import statsController from "../controllers/stats.controller";

const router = Router();

router.get("/", statsController.getStats);

export default router;
