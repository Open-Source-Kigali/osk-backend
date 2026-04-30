import { Request, Response, NextFunction } from "express";
import response from "../utils/response";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);
  response.failure(res, err.message || "Internal Server Error", 500);
}
