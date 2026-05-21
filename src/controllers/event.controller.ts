import { Request, Response, NextFunction } from "express";
import eventService from "../services/event.service";
import response from "../utils/response";
import { Event, Prisma } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import { trimStrings } from "../utils/trim-strings";

const FOLDER = "open-source-kigali/events";

type EventBody = Omit<Event, "id" | "createdAt" | "updatedAt">;

function parseBoolean(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true" || v === "1";
  return undefined;
}

function parseSpeakers(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildEventData(
  body: Record<string, unknown>,
): Prisma.EventUpdateInput {
  // Automatically trim all string inputs before processing
  const trimmedBody = trimStrings(body);

  const data: Record<string, unknown> = {};
  const passthrough = [
    "title",
    "tagline",
    "description",
    "category",
    "mode",
    "location",
    "timeLabel",
    "registerUrl",
  ];
  for (const k of passthrough) {
    if (trimmedBody[k] !== undefined && trimmedBody[k] !== "")
      data[k] = trimmedBody[k];
  }
  if (trimmedBody.featured !== undefined)
    data.featured = parseBoolean(trimmedBody.featured);
  if (trimmedBody.capacity !== undefined)
    data.capacity =
      trimmedBody.capacity === null ? null : Number(trimmedBody.capacity);
  if (trimmedBody.registered !== undefined)
    data.registered =
      trimmedBody.registered === null ? null : Number(trimmedBody.registered);
  if (trimmedBody.date !== undefined)
    data.date = new Date(trimmedBody.date as string);
  if (trimmedBody.endDate !== undefined)
    data.endDate = trimmedBody.endDate
      ? new Date(trimmedBody.endDate as string)
      : null;
  const speakers = parseSpeakers(trimmedBody.speakers);
  if (speakers !== undefined) data.speakers = speakers;
  return data;
}

/**
 * Fetches all events from the database.
 * Supports filtering by featured status via ?featured=true query parameter.
 */
async function findAllEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const featured = req.query.featured === "true" ? true : undefined;
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

/**
 * Trims input strings and adds a new event.
 */
async function addEvent(
  req: Request<unknown, unknown, Record<string, unknown>>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return response.failure(res, "Image file is required", 400);
  }

  // Validate that required fields are present before uploading to Cloudinary
  const required = ["title", "description", "category", "location", "date"];
  for (const field of required) {
    if (!req.body[field]) {
      return response.failure(res, `${field} is required`, 400);
    }
  }

  let publicId: string | undefined;
  try {
    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const data = buildEventData(req.body) as EventBody;
    data.imageUrl = uploaded.secure_url;
    data.imagePublicId = uploaded.public_id;
    if (!data.speakers) data.speakers = [];

    const newEvent = await eventService.addEvent(data);

    response.success(res, newEvent, 201, "Event created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

/**
 * Trims input strings and updates an existing event.
 */
async function updateEvent(
  req: Request<{ id: string }, unknown, Record<string, unknown>>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await eventService.findEventById(req.params.id);
    if (!existing) return response.failure(res, "Event not found", 404);

    const data = buildEventData(req.body);

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
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

/**
 * Deletes an event and its associated image.
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
