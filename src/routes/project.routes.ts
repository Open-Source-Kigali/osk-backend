import { Router } from "express";
import projectController from "../controllers/project.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
  adminRateLimit,
  publicRateLimit,
} from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, projectController.findAllProjects);
route.get("/:id", publicRateLimit, projectController.findProjectById);
route.get("/:slug", publicRateLimit, projectController.findProjectBySlug);

route.use(authMiddleware.requireAdmin, adminRateLimit);
route.post("/refresh", projectController.refreshAll);
route.post("/", upload.single("file"), projectController.addProject);
route.put("/:id", upload.single("file"), projectController.updateProject);
route.delete("/:id", projectController.deleteProject);

export default route;
