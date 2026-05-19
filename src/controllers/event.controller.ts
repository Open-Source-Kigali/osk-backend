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
  res: Response,
): Prisma.EventUpdateInput | null {
  const data: Record<string, unknown> = {};
  const passthrough = [
    "title",
    "tagline",
    "description",
    "category",
    "location",
    "timeLabel",
    "registerUrl",
  ];
  
  for (const k of passthrough) {
    if (body[k] !== undefined && body[k] !== "") data[k] = body[k];
  }

  if (body.featured !== undefined) {
    const featured = parseBoolean(body.featured);
    if (featured === undefined) {
      response.failure(res, "featured must be a boolean", 400);
      return null;
    }
    data.featured = featured;
  }

  if (body.capacity !== undefined) {
    if (body.capacity === null) {
      data.capacity = null;
    } else {
      const cap = Number(body.capacity);
      if (isNaN(cap) || cap < 0) {
        response.failure(res, "capacity must be a non-negative number", 400);
        return null;
      }
      data.capacity = cap;
    }
  }

  if (body.registered !== undefined) {
    if (body.registered === null) {
      data.registered = null;
    } else {
      const reg = Number(body.registered);
      if (isNaN(reg) || reg < 0) {
        response.failure(res, "registered must be a non-negative number", 400);
        return null;
      }
      data.registered = reg;
    }
  }

  if (body.date !== undefined) {
    const d = new Date(body.date as string);
    if (isNaN(d.getTime())) {
      response.failure(res, "date is not a valid date", 400);
      return null;
    }
    data.date = d;
  }

  if (body.endDate !== undefined) {
    if (body.endDate === null) {
      data.endDate = null;
    } else {
      const d = new Date(body.endDate as string);
      if (isNaN(d.getTime())) {
        response.failure(res, "endDate is not a valid date", 400);
        return null;
      }
      data.endDate = d;
    }
  }
  const ALLOWED_MODES = ["in-person", "online", "hybrid"] as const;
  if (body.mode !== undefined && body.mode !== "") {
    if (typeof body.mode !== "string") {
      response.failure(res, "mode must be a string", 400);
      return null;
    }
    const mode = body.mode as (typeof ALLOWED_MODES)[number];
    if (!ALLOWED_MODES.includes(mode)) {
      response.failure(
        res,
        `mode must be one of: ${ALLOWED_MODES.join(", ")}`,
        400,
      );
      return null;
    }
    data.mode = mode;
  }

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

    if (req.body.date !== undefined) {
      const d = new Date(req.body.date as string);
      if (isNaN(d.getTime()))
        return response.failure(res, "date is not a valid date", 400);
      req.body.date = d as unknown as string;
    }
    if (req.body.endDate !== undefined && req.body.endDate !== null) {
      const ed = new Date(req.body.endDate as string);
      if (isNaN(ed.getTime()))
        return response.failure(res, "endDate is not a valid date", 400);
      req.body.endDate = ed as unknown as string;
    }

    const built = buildEventData(req.body, res);
    if (!built) return; // buildEventData already sent error response
    const data = built as EventBody;
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

    if (req.body.date !== undefined) {
      const d = new Date(req.body.date as string);
      if (isNaN(d.getTime()))
        return response.failure(res, "date is not a valid date", 400);
      req.body.date = d as unknown as string;
    }
    if (req.body.endDate !== undefined && req.body.endDate !== null) {
      const ed = new Date(req.body.endDate as string);
      if (isNaN(ed.getTime()))
        return response.failure(res, "endDate is not a valid date", 400);
      req.body.endDate = ed as unknown as string;
    }

    const data = buildEventData(req.body,res);
    if (!data) return; // buildEventData already sent error response

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
