import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { ProjectStatus } from "../generated/prisma/client";

vi.mock("../services/project.service");
import projectService from "../services/project.service";

const mockProject = {
  id: "1",
  slug: "osk-backend",
  repoOwner: "open-source-kigali",
  repoName: "osk-backend",
  imageUrl: "https://example.com/project.jpg",
  imagePublicId: "proj123",
  tagline: "Open source backend",
  category: "backend",
  status: ProjectStatus.active,
  featured: true,
  maintainer: "OSK",
  langColor: "#000000",
  ghDescription: null,
  ghLanguage: null,
  ghTopics: [],
  ghStars: 0,
  ghForks: 0,
  ghOpenIssues: 0,
  ghContributors: 0,
  ghPullRequests: 0,
  ghPushedAt: null,
  lastFetchedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.resetAllMocks());

describe("GET /api/projects", () => {
  it("returns 200 and filters featured projects when featured=true is provided", async () => {
    vi.mocked(projectService.findAllProjects).mockResolvedValue([mockProject]);

    const res = await request(app).get("/api/projects?featured=true");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(vi.mocked(projectService.findAllProjects)).toHaveBeenCalledWith(
      true,
    );
  });

  it("returns 200 and fetches all projects when featured is not provided", async () => {
    vi.mocked(projectService.findAllProjects).mockResolvedValue([mockProject]);

    const res = await request(app).get("/api/projects");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(vi.mocked(projectService.findAllProjects)).toHaveBeenCalledWith(
      undefined,
    );
  });
});
