import { Router } from "express";
import memberController from "../controllers/member.controller";

const MemberRoutes = Router();

MemberRoutes.get("/", memberController.findAllMembers);

export default MemberRoutes;
