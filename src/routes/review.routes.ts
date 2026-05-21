import { Router } from "express";
import reviewController from "../controllers/review.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", reviewController.findAll);
router.get("/:id", reviewController.findById);
router.post("/", upload.single("file"), reviewController.create);
router.put(
  "/:id",
  authMiddleware.requireAdmin,
  upload.single("file"),
  reviewController.update,
);
router.delete(
  "/:id",
  authMiddleware.requireAdmin,
  reviewController.deleteReview,
);

export default router;
