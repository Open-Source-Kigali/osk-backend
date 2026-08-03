import { Router } from "express";
import memberController from "../controllers/member.controller";
import authMiddleware from "../middlewares/auth.middleware";
import {
  adminRateLimit,
  publicRateLimit,
} from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, memberController.findAllMembers);
route.post("/", publicRateLimit, memberController.addMember);
route.get("/:id", publicRateLimit, memberController.findMemberById);

route.use(authMiddleware.requireAdmin, adminRateLimit);
route.put("/:id", memberController.updateMember);
route.delete("/:id", memberController.deleteMember);

export default route;
