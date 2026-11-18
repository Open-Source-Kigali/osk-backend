import { Router } from "express";
import memberController from "../controllers/member.controller";
import { requireAdminWrite } from "../middlewares/admin-auth.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, memberController.findAllMembers);
route.post("/", publicRateLimit, memberController.addMember);
route.get("/:id", publicRateLimit, memberController.findMemberById);

route.put("/:id", ...requireAdminWrite, memberController.updateMember);
route.delete("/:id", ...requireAdminWrite, memberController.deleteMember);

export default route;
