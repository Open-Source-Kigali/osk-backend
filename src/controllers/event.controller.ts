import { Request, Response, NextFunction } from "express";
import eventService from "../services/event.service";
import response from "../utils/response";
import { Event } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";

type EventBody = Omit<Event, "id" | "createdAt" | "updatedAt">;

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
  req: Request<{}, {}, Omit<EventBody, "imageUrl" | "imagePublicId">>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return response.failure(res, "Image file is required", 400);
  }

  let publicId: string | undefined;
  try {
    const uploaded = await uploadBuffer(req.file.buffer, "open-source-kigali/events");
    publicId = uploaded.public_id;

    const { capacity, date, ...rest } = req.body;
    const newEvent = await eventService.addEvent({
      ...rest,
      capacity: capacity ? Number(capacity) : null,
      date: new Date(date),
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
    });

    response.success(res, newEvent, 201, "Event created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function updateEvent(
  req: Request<{ id: string }, {}, Partial<Omit<EventBody, "imagePublicId">>>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await eventService.findEventById(req.params.id);
    if (!existing) return response.failure(res, "Event not found", 404);

    const { capacity, date, ...rest } = req.body;
    const data: Partial<EventBody> = { ...rest };
    if (capacity !== undefined)
      data.capacity = capacity === null ? null : Number(capacity);
    if (date !== undefined) data.date = new Date(date);

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, "open-source-kigali/events");
      newPublicId = uploaded.public_id;
      data.imageUrl = uploaded.secure_url;
      data.imagePublicId = uploaded.public_id;
    }

    const updatedEvent = await eventService.updateEvent(req.params.id, data);

    if (req.file && existing.imagePublicId) {
      await destroyImage(existing.imagePublicId);
    }

    response.success(res, updatedEvent, 200, "Event updated successfully");
  } catch (err) {
    if (newPublicId) await destroyImage(newPublicId);
    next(err);
  }
}

async function deleteEvent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await eventService.findEventById(req.params.id);
    if (!existing) return response.failure(res, "Event not found", 404);

    await eventService.deleteEvent(req.params.id);
    if (existing.imagePublicId) await destroyImage(existing.imagePublicId);

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
