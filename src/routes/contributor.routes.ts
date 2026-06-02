import { Router } from "express";
import contributorController from "../controllers/contributor.controller";

const router = Router();

router.get("/", contributorController.findAllContributors);

export default router;
