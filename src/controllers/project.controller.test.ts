import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/project.service");
import projectService from "../services/project.service";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/projects", () => {
  it("passes featured=true to the service", async () => {
    vi.mocked(projectService.findAllProjects).mockResolvedValue([]);

    const res = await request(app).get("/api/projects?featured=true");

    expect(res.status).toBe(200);
    expect(projectService.findAllProjects).toHaveBeenCalledWith(true);
  });
});
