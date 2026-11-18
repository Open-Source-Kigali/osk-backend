import type { Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import { createClient, type RedisClientType } from "redis";
import { RedisStore } from "rate-limit-redis";

import { env } from "../config/env";
import response from "../utils/response";

const WINDOW_MS = 15 * 60 * 1000;

let redisClientPromise: Promise<RedisClientType> | undefined;

function getRequestIp(req: Request) {
  return req.ip ?? req.socket.remoteAddress ?? "127.0.0.1";
}

export function publicKeyGenerator(req: Request) {
  return getRequestIp(req);
}

/** Prefer the authenticated admin user id; fall back to IP before session is attached. */
export function adminKeyGenerator(req: Request) {
  if (req.authUser?.id) {
    return `admin:${req.authUser.id}`;
  }
  return getRequestIp(req);
}

async function getRedisClient() {
  if (!env.redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!redisClientPromise) {
    const client = createClient({ url: env.redisUrl });
    client.on("error", (error) => {
      console.error("Redis rate limit store error:", error);
    });

    redisClientPromise = client.connect().then(() => client);
  }

  return redisClientPromise;
}

function createStore(prefix: string) {
  if (env.nodeEnv !== "production" || !env.redisUrl) {
    return undefined;
  }

  return new RedisStore({
    prefix,
    sendCommand: async (...args: string[]) => {
      const client = await getRedisClient();
      return client.sendCommand(args as [string, ...string[]]);
    },
  });
}

function createRateLimiter(options: {
  limit: number;
  keyGenerator: (req: Request) => string;
  prefix: string;
  skipSuccessfulRequests?: boolean;
  requestWasSuccessful?: (req: Request, res: Response) => boolean;
}) {
  const store = createStore(options.prefix);
  const limiterOptions = {
    windowMs: WINDOW_MS,
    limit: options.limit,
    standardHeaders: false,
    legacyHeaders: true,
    keyGenerator: options.keyGenerator,
    passOnStoreError: true,
    handler: (_req: Request, res: Response) => {
      response.failure(res, "Too many requests. Please try again later.", 429);
    },
    ...(options.skipSuccessfulRequests ? { skipSuccessfulRequests: true } : {}),
    ...(options.requestWasSuccessful
      ? { requestWasSuccessful: options.requestWasSuccessful }
      : {}),
    ...(store ? { store } : {}),
  };

  return rateLimit(limiterOptions);
}

export function runLimiter(
  limiter: RequestHandler,
  req: Request,
  res: Response,
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      res.off("finish", settle);
      res.off("close", settle);
      resolve();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      res.off("finish", settle);
      res.off("close", settle);
      reject(error);
    };

    res.once("finish", settle);
    res.once("close", settle);

    try {
      limiter(req, res, (error?: unknown) => {
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

export const publicRateLimit = createRateLimiter({
  limit: 100,
  prefix: "public",
  keyGenerator: publicKeyGenerator,
});

export const adminRateLimit = createRateLimiter({
  limit: 1000,
  prefix: "admin",
  keyGenerator: adminKeyGenerator,
});

export const authAttemptRateLimit = createRateLimiter({
  limit: 5,
  prefix: "auth",
  keyGenerator: publicKeyGenerator,
});

/** Failed password logins only; keyed by IP + email so it does not share budget with API-key checks. */
export function loginFailureKeyGenerator(req: Request) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  return `${getRequestIp(req)}:${email}`;
}

/**
 * Counts a hit before password verification. Successful logins and 5xx responses
 * are released on finish so only credential failures stay in the budget.
 * Once totalHits exceeds the limit, the middleware responds 429 without calling next.
 */
export const loginFailureRateLimit = createRateLimiter({
  limit: 5,
  prefix: "login-fail",
  keyGenerator: loginFailureKeyGenerator,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) =>
    res.statusCode < 400 || res.statusCode >= 500,
});

export { createRateLimiter };
