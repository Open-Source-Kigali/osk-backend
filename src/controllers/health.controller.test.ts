import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("GET /api/health", () => {
  it("returns 200 with status ok and the process uptime", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect(Number.isFinite(res.body.data.uptime)).toBe(true);
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns the expected response format", async () => {
    const res = await request(app).get("/api/health");

    expect(res.body).toEqual({
      success: true,
      message: "Success",
      data: {
        status: "ok",
        uptime: expect.any(Number),
      },
    });
  });
});
