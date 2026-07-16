import { Router } from "express";
import partnerApplicationController from "../controllers/partner-application.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const route = Router();

route.post(
  "/",
  upload.single("file"),
  partnerApplicationController.addPartnerApplication,
);

route.use(authMiddleware.requireAdmin);
route.get("/", partnerApplicationController.findAllPartnerApplications);
route.get("/:id", partnerApplicationController.findPartnerApplicationById);
route.patch(
  "/:id/status",
  partnerApplicationController.updatePartnerApplicationStatus,
);
route.delete("/:id", partnerApplicationController.deletePartnerApplication);

export default route;
