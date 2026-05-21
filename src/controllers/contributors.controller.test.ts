import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Ensure admin key is set before app import so middleware reads it
process.env.ADMIN_API_KEY = "test-admin-key";

import app from "../app";

vi.mock("../services/contributors.service");
import * as contributorsService from "../services/contributors.service";

const mockContributor = {
  login: "ub-victor",
  name: "Victor",
  avatarUrl: "https://example.com/avatar.jpg",
  profileUrl: "https://github.com/ub-victor",
  bio: "Maintainer",
  company: null,
};

beforeEach(() => vi.resetAllMocks());

describe("GET /api/contributors", () => {
  it("returns 200 and contributors list", async () => {
    vi.mocked(contributorsService.readContributors).mockResolvedValue([
      mockContributor,
    ]);

    const res = await request(app).get("/api/contributors");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(vi.mocked(contributorsService.readContributors)).toHaveBeenCalled();
  });
});

describe("POST /api/contributors/refresh", () => {
  it("returns 200 and triggers refresh when admin key provided", async () => {
    vi.mocked(contributorsService.refreshContributors).mockResolvedValue({
      totalParsed: 1,
      success: 1,
      failures: 0,
      failedList: [],
    });

    const res = await request(app)
      .post("/api/contributors/refresh")
      .set("x-api-key", "test-admin-key");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(
      vi.mocked(contributorsService.refreshContributors),
    ).toHaveBeenCalled();
  });

  it("returns 403 when admin key is missing or invalid", async () => {
    const res = await request(app).post("/api/contributors/refresh");

    expect(res.status).toBe(403);
    expect(
      vi.mocked(contributorsService.refreshContributors),
    ).not.toHaveBeenCalled();
  });
});
