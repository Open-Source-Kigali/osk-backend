import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import memberRoutes from "./member.routes";
import partnerRoutes from "./partner.routes";
import partnerApplicationRoutes from "./partner-application.routes";
import eventRoutes from "./event.routes";
import projectRoutes from "./project.routes";
import reviewRoutes from "./review.routes";
import adminReviewRoutes from "./admin-review.routes";
import contributorsRoutes from "./contributors.routes";
import statsRoutes from "./stats.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/members", memberRoutes);
router.use("/partners", partnerRoutes);
router.use("/partner-applications", partnerApplicationRoutes);
router.use("/events", eventRoutes);
router.use("/projects", projectRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin/reviews", adminReviewRoutes);
router.use("/contributors", contributorsRoutes);
router.use("/stats", statsRoutes);

export default router;
