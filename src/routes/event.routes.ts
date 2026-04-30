import { Router } from "express";
import eventController from "../controllers/event.controller";
import authMiddleware from "../middlewares/auth.middleware";

const route = Router();

route.get("/", eventController.findAllEvents);
route.get("/:id", eventController.findEventById);

route.use(authMiddleware.requireAdmin);
route.post("/", authMiddleware.requireAdmin, eventController.addEvent);
route.put("/:id", eventController.updateEvent);
route.delete("/:id", eventController.deleteEvent);

export default route;
