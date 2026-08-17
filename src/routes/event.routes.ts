import { Router } from "express";
import eventController from "../controllers/event.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import {
  adminRateLimit,
  publicRateLimit,
} from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, eventController.findAllEvents);
route.get("/:id", publicRateLimit, eventController.findEventById);

route.use(authMiddleware.requireAdmin, adminRateLimit);
route.post("/", upload.single("file"), eventController.addEvent);
route.put("/:id", upload.single("file"), eventController.updateEvent);
route.delete("/:id", eventController.deleteEvent);

export default route;
