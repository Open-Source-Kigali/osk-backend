import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/stats.service");
import statsService from "../services/stats.service";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/stats", () => {
  it("returns 200 with the correct stats shape", async () => {
    const mockData = {
      contributors: 12,
      members: 1500,
      projects: 10,
      events: 4,
      partners: 6,
      reviews: 5,
      pullRequests: 25,
    };

    vi.mocked(statsService.getStats).mockResolvedValue(mockData);

    const res = await request(app).get("/api/stats");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Stats fetched successfully");
    expect(res.body.data).toEqual(mockData);
  });
});
