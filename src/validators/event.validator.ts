import { z } from "zod";

const parseBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return undefined;
};

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const parseOptionalDate = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
};

const parseSpeakers = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // ignore invalid JSON
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
};

const urlOrUndefined = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;
    return val.trim() === "" ? undefined : val;
  },
  z.string().url().optional(),
);

export const eventCreateSchema = z.object({
  title: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().min(1),
  category: z.string().min(1),
  mode: z.string().optional(),
  featured: z.preprocess(parseBoolean, z.boolean()).optional(),
  capacity: z.preprocess(parseOptionalNumber, z.number().int().nonnegative().optional()),
  registered: z.preprocess(parseOptionalNumber, z.number().int().nonnegative().optional()),
  date: z.preprocess(parseOptionalDate, z.date()),
  endDate: z.preprocess(parseOptionalDate, z.date()).optional(),
  timeLabel: z.string().optional(),
  location: z.string().min(1),
  speakers: z.preprocess(parseSpeakers, z.array(z.string()).optional()),
  registerUrl: urlOrUndefined,
});

export const eventUpdateSchema = eventCreateSchema.partial();
