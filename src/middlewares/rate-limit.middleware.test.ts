import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    nodeEnv: "test",
    redisUrl: "",
    adminApiKey: "expected-admin-key",
  },
}));

import authMiddleware from "./auth.middleware";
import { adminKeyGenerator, createRateLimiter } from "./rate-limit.middleware";

describe("rate limiting middleware", () => {
  it("returns 429 when the public limit is exceeded and includes legacy headers", async () => {
    const app = express();
    const limiter = createRateLimiter({
      limit: 2,
      prefix: "test-public",
      keyGenerator: (req) => req.ip ?? "127.0.0.1",
    });

    app.get("/limited", limiter, (_req, res) => {
      res.json({ ok: true });
    });

    const first = await request(app).get("/limited");
    const second = await request(app).get("/limited");
    const third = await request(app).get("/limited");

    expect(first.status).toBe(200);
    expect(first.headers["x-ratelimit-limit"]).toBe("2");
    expect(first.headers["x-ratelimit-remaining"]).toBeDefined();
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.success).toBe(false);
    expect(third.headers["x-ratelimit-limit"]).toBe("2");
  });

  it("throttles repeated invalid admin attempts", async () => {
    const app = express();

    app.get("/admin", authMiddleware.requireAdmin, (_req, res) => {
      res.json({ ok: true });
    });

    const responses = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push(await request(app).get("/admin"));
    }

    expect(responses.slice(0, 5).every((res) => res.status === 403)).toBe(true);
    expect(responses[5].status).toBe(429);
    expect(responses[5].headers["x-ratelimit-limit"]).toBe("5");
  });

  it("keys the admin limiter by x-api-key", async () => {
    const app = express();
    const limiter = createRateLimiter({
      limit: 1,
      prefix: "test-admin",
      keyGenerator: adminKeyGenerator,
    });

    app.get("/admin", limiter, (_req, res) => {
      res.json({ ok: true });
    });

    const first = await request(app).get("/admin").set("x-api-key", "key-a");
    const second = await request(app).get("/admin").set("x-api-key", "key-b");
    const third = await request(app).get("/admin").set("x-api-key", "key-a");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });
});
