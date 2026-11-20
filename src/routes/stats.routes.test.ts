import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../services/stats.service", () => ({
  default: { getStats: vi.fn() },
}));

import statsService from "../services/stats.service";
import statsRoutes from "./stats.routes";

describe("stats route rate limiting", () => {
  it("allows 100 requests and rejects the next without calling the stats service", async () => {
    const app = express();
    app.use("/api/stats", statsRoutes);
    vi.mocked(statsService.getStats).mockResolvedValue({
      contributors: 12,
      members: 1500,
      projects: 10,
      events: 4,
      partners: 6,
      reviews: 5,
      pullRequests: 25,
    });

    for (let index = 0; index < 100; index += 1) {
      const res = await request(app).get("/api/stats");
      expect(res.status).toBe(200);
    }

    const res = await request(app).get("/api/stats");

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Too many requests. Please try again later.");
    expect(res.headers["x-ratelimit-limit"]).toBe("100");
    expect(res.headers["x-ratelimit-remaining"]).toBe("0");
    expect(res.headers["retry-after"]).toBeDefined();
    expect(statsService.getStats).toHaveBeenCalledTimes(100);
  });
});
