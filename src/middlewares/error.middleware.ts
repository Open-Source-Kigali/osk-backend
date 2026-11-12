import { Request, Response, NextFunction } from "express";
import multer from "multer";
import response from "../utils/response";
import { Prisma } from "../generated/prisma/client";
import {
  IMAGE_TOO_LARGE_MESSAGE,
  INVALID_UPLOAD_MESSAGE,
  UploadValidationError,
} from "./upload.middleware";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof UploadValidationError) {
    return response.failure(res, err.message, err.statusCode);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return response.failure(res, IMAGE_TOO_LARGE_MESSAGE, 413);
    }

    return response.failure(res, INVALID_UPLOAD_MESSAGE, 400);
  }

  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const rawField =
        (err.meta?.target as string[] | undefined)?.[0] ?? "field";
      const field = String(rawField).replace(/_/g, " ");
      return response.failure(res, `${field} is already taken`, 409);
    }
    if (err.code === "P2025") {
      return response.failure(res, "Record not found", 404);
    }
  }

  response.failure(res, "Internal Server Error", 500);
}
