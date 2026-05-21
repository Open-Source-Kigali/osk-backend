import { ZodError, ZodSchema } from "zod";
import { Response } from "express";
import response from "./response";

export function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "root";
      const msg = issue.message;
      // Handle Zod enum/enum-like messages that mention expected options
      if (/expected one of/.test(msg) || /Invalid option/.test(msg)) {
        const matches = [...msg.matchAll(/"([^\"]+)"/g)];
        const options = matches.map((m) => m[1]);
        if (options.length)
          return `Invalid ${field}. Allowed values: ${options.join(", ")}`;
      }
      // Default to the previous 'field: message' format
      return `${field}: ${msg}`;
    })
    .join("; ");
}

export function parseRequestBody<T>(
  schema: ZodSchema<T>,
  body: unknown,
  res: Response,
): T | undefined {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = formatZodError(err);
      response.failure(res, errors, 400);
      return undefined;
    }
    throw err;
  }
}
