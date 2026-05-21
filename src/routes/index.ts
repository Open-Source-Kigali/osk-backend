import { Router } from "express";
import healthRoutes from "./health.routes";
import memberRoutes from "./member.routes";
import partnerRoutes from "./partner.routes";
import eventRoutes from "./event.routes";
import projectRoutes from "./project.routes";
import contributorsRoutes from "./contributors.routes";
import reviewRoutes from "./review.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/members", memberRoutes);
router.use("/partners", partnerRoutes);
router.use("/events", eventRoutes);
router.use("/projects", projectRoutes);
router.use("/contributors", contributorsRoutes);
router.use("/reviews", reviewRoutes);

export default router;
