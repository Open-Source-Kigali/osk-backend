import { Router } from "express";
import reviewController from "../controllers/review.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const route = Router();

route.get("/", reviewController.findAllReviews);
route.get("/:id", reviewController.findReviewById);
route.post("/", upload.single("file"), reviewController.addReview);

route.use(authMiddleware.requireAdmin);
route.put("/:id", upload.single("file"), reviewController.updateReview);
route.delete("/:id", reviewController.deleteReview);

export default route;
