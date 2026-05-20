import { Router } from "express";
import contributorsController from "../controllers/contributors.controller";
import authMiddleware from "../middlewares/auth.middleware";

const route = Router();

route.get("/", contributorsController.getContributors);
route.use(authMiddleware.requireAdmin);
route.post("/refresh", contributorsController.refreshContributors);

export default route;
