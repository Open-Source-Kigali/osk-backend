import { Router } from "express";
import partnerApplicationController from "../controllers/partner-application.controller";
import {
  requireAdminRead,
  requireAdminWrite,
} from "../middlewares/admin-auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const route = Router();

route.post(
  "/",
  publicRateLimit,
  upload.single("file"),
  partnerApplicationController.addPartnerApplication,
);

route.get(
  "/",
  ...requireAdminRead,
  partnerApplicationController.findAllPartnerApplications,
);
route.get(
  "/:id",
  ...requireAdminRead,
  partnerApplicationController.findPartnerApplicationById,
);
route.patch(
  "/:id/status",
  ...requireAdminWrite,
  partnerApplicationController.updatePartnerApplicationStatus,
);
route.delete(
  "/:id",
  ...requireAdminWrite,
  partnerApplicationController.deletePartnerApplication,
);

export default route;
