import { Router } from "express";
import healthController from "../controllers/health.controller";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const healthRoutes = Router();

healthRoutes.get("/", publicRateLimit, healthController.checkHealth);

export default healthRoutes;
