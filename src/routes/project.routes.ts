import { Router } from "express";
import projectController from "../controllers/project.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const route = Router();

route.get("/", projectController.findAllProjects);
route.get("/:slug", projectController.findProjectBySlug);

route.use(authMiddleware.requireAdmin);
route.post("/refresh", projectController.refreshAll);
route.post("/", upload.single("file"), projectController.addProject);
route.put("/:id", upload.single("file"), projectController.updateProject);
route.delete("/:id", projectController.deleteProject);

export default route;
