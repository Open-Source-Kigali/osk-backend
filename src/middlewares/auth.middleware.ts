import type { NextFunction, Response, Request } from "express";
import { env } from "../config/env";
import response from "../utils/response";
import { authAttemptRateLimit } from "./rate-limit.middleware";

async function rejectWithAuthLimit(req: Request, res: Response) {
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    res.once("finish", settle);
    res.once("close", settle);

    try {
      authAttemptRateLimit(req, res, (error?: unknown) => {
        res.off("finish", settle);
        res.off("close", settle);

        if (error) {
          fail(error);
          return;
        }

        settle();
      });
    } catch (error) {
      fail(error);
    }
  });
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];

  if (!env.adminApiKey) {
    await rejectWithAuthLimit(req, res);
    if (!res.headersSent) {
      return response.failure(res, "Server admin key not configured", 500);
    }
    return;
  }
  if (apiKey !== env.adminApiKey) {
    await rejectWithAuthLimit(req, res);
    if (!res.headersSent) {
      return response.failure(res, "Admin access required", 403);
    }
    return;
  }
  next();
}

export default {
  requireAdmin,
};
