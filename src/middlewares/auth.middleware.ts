import type { NextFunction, Response, Request } from "express";
import response from "../utils/response";

function requireAdmin(
  req: Request & { user?: { role: string } },
  res: Response,
  next: NextFunction,
) {
  if (req.user?.role !== "ADMIN") {
    return response.failure(res, "Admin access required", 403);
  }
  next();
}

export default {
  requireAdmin,
};
