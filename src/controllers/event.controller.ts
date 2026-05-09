import { Request, Response, NextFunction } from "express";
import eventService from "../services/event.service";
import response from "../utils/response";
import { Event, Prisma } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";

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
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (body.featured !== undefined) data.featured = parseBoolean(body.featured);
  if (body.capacity !== undefined)
    data.capacity = body.capacity === null ? null : Number(body.capacity);
  if (body.registered !== undefined)
    data.registered = body.registered === null ? null : Number(body.registered);
  if (body.date !== undefined) data.date = new Date(body.date as string);
  if (body.endDate !== undefined)
    data.endDate = body.endDate ? new Date(body.endDate as string) : null;
  const speakers = parseSpeakers(body.speakers);
  if (speakers !== undefined) data.speakers = speakers;
  return data;
}

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
  req: Request<unknown, unknown, Record<string, unknown>>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return response.failure(res, "Image file is required", 400);
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
