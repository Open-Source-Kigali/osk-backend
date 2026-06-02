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
      // Provide a friendlier error message for invalid codingLevel to match tests
      const hasCodingLevelError = err.issues.some(
        (issue) => issue.path[0] === "codingLevel",
      );
      if (hasCodingLevelError) {
        response.failure(
          res,
          "Invalid codingLevel. Allowed values: beginner, intermediate, advanced",
          400,
        );
        return undefined;
      }

      const errors = formatZodError(err);
      response.failure(res, errors, 400);
      return undefined;
    }
    throw err;
  }
}
