import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/contributors.service");
import contributorsService from "../services/contributors.service";

const mockContributorProfile = {
  login: "nick-lemy",
  name: "Nick Lemy",
  avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
  profileUrl: "https://github.com/nick-lemy",
  bio: "Open source enthusiast",
  company: "OSK",
};

const ADMIN_KEY = "test-admin-key";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/contributors", () => {
  it("returns 200 with cached contributor profiles", async () => {
    vi.mocked(contributorsService.readContributors).mockResolvedValue([
      mockContributorProfile,
    ]);

    const res = await request(app).get("/api/contributors");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].login).toBe("nick-lemy");
  });

  it("returns 200 with empty array when no contributors", async () => {
    vi.mocked(contributorsService.readContributors).mockResolvedValue([]);

    const res = await request(app).get("/api/contributors");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});

describe("POST /api/contributors/refresh", () => {
  it("returns 403 without admin key", async () => {
    const res = await request(app).post("/api/contributors/refresh");

    expect(res.status).toBe(403);
  });

  it("returns 200 with refresh summary when admin", async () => {
    vi.mocked(contributorsService.refreshContributors).mockResolvedValue({
      total: 2,
      saved: 2,
      skipped: 0,
      failed: 0,
      results: [
        { login: "nick-lemy", status: "saved", error: null },
        { login: "another-user", status: "saved", error: null },
      ],
    });

    const res = await request(app)
      .post("/api/contributors/refresh")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.saved).toBe(2);
  });

  it("includes skipped and failed counts in summary", async () => {
    vi.mocked(contributorsService.refreshContributors).mockResolvedValue({
      total: 3,
      saved: 1,
      skipped: 1,
      failed: 1,
      results: [
        { login: "nick-lemy", status: "saved", error: null },
        { login: "notfound", status: "skipped", error: null },
        { login: "error-user", status: "failed", error: "Network error" },
      ],
    });

    const res = await request(app)
      .post("/api/contributors/refresh")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.saved).toBe(1);
    expect(res.body.data.skipped).toBe(1);
    expect(res.body.data.failed).toBe(1);
  });
});
