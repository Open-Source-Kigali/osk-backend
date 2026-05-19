import { Router } from "express";
import projectController from "../controllers/project.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const route = Router();

route.get("/", projectController.findAllProjects);

// Check if parameter is a UUID, otherwise skip to /:slug
route.get(
  "/:id",
  (req, res, next) => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(req.params.id)) {
      return next("route");
    }
    next();
  },
  projectController.findProjectById,
);
route.get("/:slug", projectController.findProjectBySlug);

route.use(authMiddleware.requireAdmin);
route.post("/refresh", projectController.refreshAll);
route.post("/", upload.single("file"), projectController.addProject);
route.put("/:id", upload.single("file"), projectController.updateProject);
route.delete("/:id", projectController.deleteProject);

export default route;
