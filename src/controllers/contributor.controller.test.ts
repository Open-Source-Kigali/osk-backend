import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/contributor.service");
import contributorService from "../services/contributor.service";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/contributors", () => {
  it("returns 200 with a list of contributors", async () => {
    vi.mocked(contributorService.getContributors).mockResolvedValue([
      {
        login: "Nick-Lemy",
        html_url: "https://github.com/Nick-Lemy",
        ok: true,
      },
    ]);

    const res = await request(app).get("/api/contributors");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});
