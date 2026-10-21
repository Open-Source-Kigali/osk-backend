import { Router } from "express";
import reviewController from "../controllers/review.controller";
import {
  requireAdminRead,
  requireAdminWrite,
} from "../middlewares/admin-auth.middleware";

const route = Router();

route.get("/", ...requireAdminRead, reviewController.listReviewsForModeration);
route.get(
  "/:id",
  ...requireAdminRead,
  reviewController.findReviewForModeration,
);
route.patch(
  "/:id/status",
  ...requireAdminWrite,
  reviewController.setReviewModerationStatus,
);

export default route;
