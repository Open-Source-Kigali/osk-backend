import { Request, Response, NextFunction } from "express";
import response from "../utils/response";
import { prisma } from "../config/prisma";

async function checkHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.success(res, { status: "ok", uptime: process.uptime(), db: "connected" });
  } catch (err) {
    res.status(503).json({ success: false, message: "Database connection failed", data: null });
  }
}

export default { checkHealth };
