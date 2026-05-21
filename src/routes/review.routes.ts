import { Router } from "express";
import reviewController from "../controllers/review.controller";
import auth from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/", reviewController.findAll);
router.get("/:id", reviewController.findById);

router.post("/", upload.single("file"), reviewController.create);
router.put(
  "/:id",
  auth.requireAdmin,
  upload.single("file"),
  reviewController.update,
);
router.delete("/:id", auth.requireAdmin, reviewController.delete);

export default router;
