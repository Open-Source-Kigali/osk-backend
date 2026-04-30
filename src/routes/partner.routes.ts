import { Router } from "express";
import partnerControllers from "../controllers/partner.controllers";
import authMiddleware from "../middlewares/auth.middleware";

const route = Router();

route.get("/", partnerControllers.findAllPartners);
route.post("/", partnerControllers.addPartner);
route.get("/:id", partnerControllers.findPartnerById);

route.use(authMiddleware.requireAdmin);
route.put("/:id", partnerControllers.updatePartner);
route.delete("/:id", partnerControllers.deletePartner);

export default route;
