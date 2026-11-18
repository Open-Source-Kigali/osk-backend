import { Router } from "express";
import partnerControllers from "../controllers/partner.controllers";
import { requireAdminWrite } from "../middlewares/admin-auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, partnerControllers.findAllPartners);
route.get("/:id", publicRateLimit, partnerControllers.findPartnerById);

route.post(
  "/",
  ...requireAdminWrite,
  upload.single("file"),
  partnerControllers.addPartner,
);
route.put(
  "/:id",
  ...requireAdminWrite,
  upload.single("file"),
  partnerControllers.updatePartner,
);
route.delete("/:id", ...requireAdminWrite, partnerControllers.deletePartner);

export default route;
