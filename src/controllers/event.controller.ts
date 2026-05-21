import { Request, Response, NextFunction } from "express";
import eventService from "../services/event.service";
import response from "../utils/response";
import { Event } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import { parseRequestBody } from "../utils/validation";
import {
  createEventSchema,
  updateEventSchema,
  CreateEventInput,
  UpdateEventInput,
} from "../schemas/event.schema";

const FOLDER = "open-source-kigali/events";

type EventBody = Omit<Event, "id" | "createdAt" | "updatedAt">;

/**
 * Fetches all events from the database.
 */
async function findAllEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const allEvents = await eventService.findAllEvents();
    response.success(res, allEvents, 200, "Events retrieved successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches a single event by its ID.
 */
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

/**
 * Validates the request body using Zod and adds a new event.
 * Handles file upload to Cloudinary and ensures non-empty speakers array.
 */
async function addEvent(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return response.failure(res, "Image file is required", 400);
  }

  let publicId: string | undefined;
  try {
    const data = parseRequestBody<CreateEventInput>(
      createEventSchema,
      req.body,
      res,
    );
    if (!data) return;

    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const eventData: EventBody = {
      ...data,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      speakers: data.speakers ?? [],
    } as EventBody;

    const newEvent = await eventService.addEvent(eventData);

    response.success(res, newEvent, 201, "Event created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

/**
 * Validates the request body using Zod and updates an existing event.
 * Handles optional file update to Cloudinary.
 */
async function updateEvent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await eventService.findEventById(req.params.id);
    if (!existing) return response.failure(res, "Event not found", 404);

    const data = parseRequestBody<UpdateEventInput>(
      updateEventSchema,
      req.body,
      res,
    );
    if (!data) return;

    // Filter out empty strings or undefined values that shouldn't be updated
    const cleanedData: Record<string, unknown> = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    );

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      newPublicId = uploaded.public_id;
      cleanedData.imageUrl = uploaded.secure_url;
      cleanedData.imagePublicId = uploaded.public_id;
    }

    const updatedEvent = await eventService.updateEvent(
      req.params.id,
      cleanedData,
    );

    if (req.file && existing.imagePublicId) {
      await destroyImage(existing.imagePublicId);
    }

    response.success(res, updatedEvent, 200, "Event updated successfully");
  } catch (err) {
    if (newPublicId) await destroyImage(newPublicId);
    next(err);
  }
}

/**
 * Deletes an event by its ID and removes its image from Cloudinary.
 */
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
