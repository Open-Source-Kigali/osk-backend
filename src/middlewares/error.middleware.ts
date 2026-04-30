import { Request, Response, NextFunction } from "express";
import response from "../utils/response";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
  }
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[] | undefined)?.join(", ");
      return response.failure(
        res,
        `A record with this ${fields ?? "value"} already exists`,
        409,
      );
    }
    if (err.code === "P2025") {
      return response.failure(res, "Record not found", 404);
    }
  }
  response.failure(res, err.message || "Internal Server Error", 500);
}
