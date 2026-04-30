import { Router } from "express";
import memberController from "../controllers/member.controller";
import authMiddleware from "../middlewares/auth.middleware";

const route = Router();

route.get("/", memberController.findAllMembers);
route.post("/", memberController.addMember);
route.get("/:id", memberController.findMemberById);

route.use(authMiddleware.requireAdmin);
route.put("/:id", memberController.updateMember);
route.delete("/:id", memberController.deleteMember);

export default route;
