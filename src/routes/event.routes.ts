import { Router } from "express";
import eventController from "../controllers/event.controller";
import { requireAdminWrite } from "../middlewares/admin-auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { publicRateLimit } from "../middlewares/rate-limit.middleware";

const route = Router();

route.get("/", publicRateLimit, eventController.findAllEvents);
route.get("/:id", publicRateLimit, eventController.findEventById);

route.post(
  "/",
  ...requireAdminWrite,
  upload.single("file"),
  eventController.addEvent,
);
route.put(
  "/:id",
  ...requireAdminWrite,
  upload.single("file"),
  eventController.updateEvent,
);
route.delete("/:id", ...requireAdminWrite, eventController.deleteEvent);

export default route;
