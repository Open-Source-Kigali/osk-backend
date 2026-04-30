import { Request, Response, NextFunction } from "express";
import eventService from "../services/event.service";
import response from "../utils/response";
import { Event } from "../generated/prisma/client";

async function findAllEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const allEvents = await eventService.findAllEvents();
    response.success(res, allEvents, 200, "Events retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function findEventById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const event = await eventService.findEventById(req.params.id);
    if (!event) {
      return response.failure(res, "Event not found", 404);
    }
    return response.success(res, event, 200, "Event retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function addEvent(
  req: Request<{}, {}, Omit<Event, "id" | "createdAt" | "updatedAt">>,
  res: Response,
  next: NextFunction,
) {
  try {
    const newEvent = await eventService.addEvent(req.body);
    response.success(res, newEvent, 201, "Event created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateEvent(
  req: Request<
    { id: string },
    {},
    Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const updatedEvent = await eventService.updateEvent(
      req.params.id,
      req.body,
    );
    response.success(res, updatedEvent, 200, "Event updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    await eventService.deleteEvent(req.params.id);
    response.success(res, null, 204, "Event deleted successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllEvents,
  findEventById,
  addEvent,
  updateEvent,
  deleteEvent,
};
