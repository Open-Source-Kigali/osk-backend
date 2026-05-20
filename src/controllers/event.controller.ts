import { Request, Response, NextFunction } from "express";
import eventService from "../services/event.service";
import response from "../utils/response";
import { Event, Prisma } from "../generated/prisma/client";
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

// Helper parsing functions removed — not used after merge. Kept intentionally
// minimal to avoid lint errors and keep file focused.
async function findAllEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const featured = _req.query.featured === "true" ? true : undefined;
    const allEvents = await eventService.findAllEvents(featured);
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

async function addEvent(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return response.failure(res, "Image file is required", 400);
  }

  const requiredFields = [
    "title",
    "description",
    "category",
    "location",
    "date",
  ];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return response.failure(res, `Missing required field: ${field}`, 400);
    }
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

    const dataToSave: EventBody = {
      ...data,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
    } as EventBody;

    const newEvent = await eventService.addEvent(dataToSave);

    response.success(res, newEvent, 201, "Event created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

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

    const filteredData: Prisma.EventUpdateInput = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    ) as Prisma.EventUpdateInput;

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      newPublicId = uploaded.public_id;
      filteredData.imageUrl = uploaded.secure_url;
      filteredData.imagePublicId = uploaded.public_id;
    }

    const updatedEvent = await eventService.updateEvent(
      req.params.id,
      filteredData,
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
