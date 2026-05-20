import { Router } from "express";
import partnerControllers from "../controllers/partner.controllers";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const route = Router();

route.get("/", partnerControllers.findAllPartners);
route.get("/:id", partnerControllers.findPartnerById);

route.use(authMiddleware.requireAdmin);
route.post("/", upload.single("file"), partnerControllers.addPartner);
route.put("/:id", upload.single("file"), partnerControllers.updatePartner);
route.delete("/:id", partnerControllers.deletePartner);

export default route;
