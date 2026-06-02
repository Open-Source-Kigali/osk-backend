import { Request, Response, NextFunction } from "express";
import response from "../utils/response";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
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
