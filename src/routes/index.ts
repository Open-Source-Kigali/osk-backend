import { Router } from "express";
import healthRoutes from "./health.routes";
import MemberRoutes from "./member.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/members", MemberRoutes);

export default router;
