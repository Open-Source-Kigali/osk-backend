import { Router } from "express";
import partnerControllers from "../controllers/partner.controllers";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
  adminRateLimit,
  publicRateLimit,
} from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, partnerControllers.findAllPartners);
route.get("/:id", publicRateLimit, partnerControllers.findPartnerById);
route.use(authMiddleware.requireAdmin, adminRateLimit);
route.post("/", upload.single("file"), partnerControllers.addPartner);
route.put("/:id", upload.single("file"), partnerControllers.updatePartner);
route.delete("/:id", partnerControllers.deletePartner);

export default route;
