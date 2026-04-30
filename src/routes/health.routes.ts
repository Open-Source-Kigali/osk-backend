import { Router } from "express";
import healthController from "../controllers/health.controller";

const healthRoutes = Router();

healthRoutes.get("/", healthController.checkHealth);

export default healthRoutes;
