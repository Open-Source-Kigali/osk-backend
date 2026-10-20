import { Router } from "express";
import projectController from "../controllers/project.controller";
import { requireAdminWrite } from "../middlewares/admin-auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, projectController.findAllProjects);
route.get("/:id", publicRateLimit, projectController.findProjectById);
route.get("/slug/:slug", publicRateLimit, projectController.findProjectBySlug);

route.post("/refresh", ...requireAdminWrite, projectController.refreshAll);
route.post(
  "/",
  ...requireAdminWrite,
  upload.single("file"),
  projectController.addProject,
);
route.put(
  "/:id",
  ...requireAdminWrite,
  upload.single("file"),
  projectController.updateProject,
);
route.delete("/:id", ...requireAdminWrite, projectController.deleteProject);

export default route;
