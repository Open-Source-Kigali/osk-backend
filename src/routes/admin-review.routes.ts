import { Router } from "express";
import reviewController from "../controllers/review.controller";
import {
  requireAdminRead,
  requireAdminWrite,
} from "../middlewares/admin-auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const route = Router();

route.post(
  "/",
  ...requireAdminWrite,
  upload.single("file"),
  reviewController.addAdminReview,
);
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
