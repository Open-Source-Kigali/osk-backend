import { Router } from "express";
import memberController from "../controllers/member.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  memberCreateSchema,
  memberUpdateSchema,
} from "../validators/member.validator";

const route = Router();

route.get("/", memberController.findAllMembers);
route.post("/", validate(memberCreateSchema), memberController.addMember);
route.get("/:id", memberController.findMemberById);

route.use(authMiddleware.requireAdmin);
route.put(
  "/:id",
  validate(memberUpdateSchema),
  memberController.updateMember,
);
route.delete("/:id", memberController.deleteMember);

export default route;
