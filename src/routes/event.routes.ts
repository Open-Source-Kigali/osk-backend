import { Router } from "express";
import eventController from "../controllers/event.controller";
import authMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  eventCreateSchema,
  eventUpdateSchema,
} from "../validators/event.validator";

const route = Router();

route.get("/", eventController.findAllEvents);
route.get("/:id", eventController.findEventById);

route.use(authMiddleware.requireAdmin);
route.post(
  "/",
  upload.single("file"),
  validate(eventCreateSchema),
  eventController.addEvent,
);
route.put(
  "/:id",
  upload.single("file"),
  validate(eventUpdateSchema),
  eventController.updateEvent,
);
route.delete("/:id", eventController.deleteEvent);

export default route;
