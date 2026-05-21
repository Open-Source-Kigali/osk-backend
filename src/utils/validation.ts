import { ZodError, ZodSchema } from "zod";
import { Response } from "express";
import response from "./response";

/**
 * Formats Zod errors into a human-readable string.
 * @param error - The ZodError object to format.
 * @returns A semicolon-separated string of field errors.
 */
export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "root";
      const msg = issue.message;

      // Handle Zod enum/enum-like messages that mention expected options
      if (/expected one of/.test(msg) || /Invalid option/.test(msg)) {
        const matches = [...msg.matchAll(/"([^\"]+)"/g)];
        const options = matches.map((m) => m[1]);
        if (options.length) {
          return `Invalid ${field}. Allowed values: ${options.join(", ")}`;
        }
      }

      // Default to 'field: message' format
      return `${field}: ${msg}`;
    })
    .join("; ");
}

/**
 * Parses a request body using the provided Zod schema.
 * Automatically sends a 400 response if validation fails.
 * @param schema - The Zod schema to validate against.
 * @param body - The request body to parse.
 * @param res - The Express response object.
 * @returns The parsed data of type T, or undefined if validation fails.
 */
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
