import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import response from "../utils/response";

async function checkHealth(_req: Request, res: Response, _next: NextFunction) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.success(
      res,
      { status: "ok", uptime: process.uptime(), db: "ok" },
      200,
      "Service is healthy",
    );
  } catch {
    res.status(503).json({
      status: "ok",
      uptime: process.uptime(),
      db: "unreachable",
    });
  }
}

export default { checkHealth };
