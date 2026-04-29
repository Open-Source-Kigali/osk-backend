import { Router } from "express";
import { checkHealth } from "../controllers/health.controller";

const healthRoutes = Router();

healthRoutes.get("/", checkHealth);

export default healthRoutes;
