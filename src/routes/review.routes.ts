import { Router } from "express";
import reviewController from "../controllers/review.controller";
import { requireAdminWrite } from "../middlewares/admin-auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, reviewController.findAllReviews);
route.get("/:id", publicRateLimit, reviewController.findReviewById);
route.post(
  "/",
  publicRateLimit,
  upload.single("file"),
  reviewController.addReview,
);

route.put(
  "/:id",
  ...requireAdminWrite,
  upload.single("file"),
  reviewController.updateReview,
);
route.delete("/:id", ...requireAdminWrite, reviewController.deleteReview);

export default route;
