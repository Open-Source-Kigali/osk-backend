import { Router } from "express";
import healthRoutes from "./health.routes";
import memberRoutes from "./member.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/members", memberRoutes);

export default router;
