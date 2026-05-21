import { z } from "zod";

/**
 * Base schema for event data sharing common fields between create and update.
 */
const eventBaseSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  tagline: z.string().trim().optional().nullable(),
  description: z.string().min(1, "Description is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  // Restrict mode to specific allowed values
  mode: z
    .enum(["in-person", "virtual", "hybrid"] as const)
    .default("in-person"),
  featured: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .default(false),
  // Ensure capacity is a non-negative integer
  capacity: z
    .union([z.number().int().nonnegative(), z.string(), z.null()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const num = Number(v);
      if (isNaN(num)) return undefined;
      return num;
    }),
  // Ensure registered count is a non-negative integer
  registered: z
    .union([z.number().int().nonnegative(), z.string(), z.null()])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const num = Number(v);
      if (isNaN(num)) return undefined;
      return num;
    }),
  // Validate date format and ensure it's a valid date
  date: z
    .string()
    .min(1, "Date is required")
    .transform((v) => new Date(v))
    .refine((date) => !isNaN(date.getTime()), {
      message: "Date must be a valid ISO date string",
    }),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null))
    .refine((date) => date === null || !isNaN(date.getTime()), {
      message: "End date must be a valid ISO date string",
    }),
  timeLabel: z.string().trim().optional().nullable(),
  location: z.string().min(1, "Location is required").trim(),
  // Normalize speakers from string, comma-separated string, or array
  speakers: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .nullable()
    .transform((v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === "string") {
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
      return [];
    })
    .default([]),
  registerUrl: z.string().trim().optional().nullable(),
});

/**
 * Schema for creating a new event.
 * Includes a refinement to ensure registered count does not exceed capacity.
 */
export const createEventSchema = eventBaseSchema.refine(
  (data) => {
    if (
      typeof data.capacity === "number" &&
      typeof data.registered === "number"
    ) {
      return data.capacity >= data.registered;
    }
    return true;
  },
  {
    message: "Registered count cannot exceed capacity",
    path: ["registered"],
  },
);

/**
 * Schema for updating an existing event.
 */
export const updateEventSchema = eventBaseSchema
  .omit({ mode: true, featured: true, speakers: true })
  .partial()
  .extend({
    mode: z.enum(["in-person", "virtual", "hybrid"] as const).optional(),
    featured: z
      .union([z.boolean(), z.string().transform((v) => v === "true")])
      .optional(),
    speakers: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .nullable()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return [];
        if (Array.isArray(v)) return v.map(String);

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
      }),
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
