import { Router } from "express";
import reviewController from "../controllers/review.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
  adminRateLimit,
  publicRateLimit,
} from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, reviewController.findAllReviews);
route.get("/:id", publicRateLimit, reviewController.findReviewById);
route.post(
  "/",
  publicRateLimit,
  upload.single("file"),
  reviewController.addReview,
);

route.use(authMiddleware.requireAdmin, adminRateLimit);
route.put("/:id", upload.single("file"), reviewController.updateReview);
route.delete("/:id", reviewController.deleteReview);

export default route;
