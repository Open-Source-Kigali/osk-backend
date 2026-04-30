import { Router } from "express";
import healthRoutes from "./health.routes";
import memberRoutes from "./member.routes";
import partnerRoutes from "./partner.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/members", memberRoutes);
router.use("/partners", partnerRoutes);

export default router;
