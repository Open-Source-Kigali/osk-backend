import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../generated/prisma/client";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

import { prisma } from "../config/prisma";
import projectService from "./project.service";
import type { RepoSnapshot } from "./github.service";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const mockProject = {
  id: "1",
  slug: "osk-backend",
  repoOwner: "Open-Source-Kigali",
  repoName: "osk-backend",
  imageUrl: "https://example.com/image.png",
  imagePublicId: "image-public-id",
  tagline: "The API powering Open Source Kigali's project directory",
  category: "backend",
  status: "active" as const,
  featured: true,
  maintainer: "Nick-Lemy",
  langColor: "#3178c6",
  ghDescription:
    "REST API for tracking OSK members, projects, and contributions",
  ghLanguage: "TypeScript",
  ghTopics: ["typescript", "express", "prisma"],
  ghStars: 24,
  ghForks: 78,
  ghOpenIssues: 52,
  ghContributors: 33,
  ghPullRequests: 5,
  ghPushedAt: new Date(),
  lastFetchedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => mockReset(prismaMock));

describe("findAllProjects", () => {
  it("queries with no filter when neither argument is given", async () => {
    prismaMock.project.findMany.mockResolvedValue([mockProject]);

    const result = await projectService.findAllProjects();

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
      omit: { imagePublicId: true },
    });
    expect(result).toEqual([mockProject]);
  });

  it("filters by featured only", async () => {
    prismaMock.project.findMany.mockResolvedValue([mockProject]);

    await projectService.findAllProjects(true);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      omit: { imagePublicId: true },
    });
  });

  it("filters by category only", async () => {
    prismaMock.project.findMany.mockResolvedValue([mockProject]);

    await projectService.findAllProjects(undefined, "backend");

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: { category: { equals: "backend" } },
      orderBy: { createdAt: "desc" },
      omit: { imagePublicId: true },
    });
  });

  it("filters by both featured and category", async () => {
    prismaMock.project.findMany.mockResolvedValue([mockProject]);

    await projectService.findAllProjects(true, "backend");

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: { featured: true, category: { equals: "backend" } },
      orderBy: { createdAt: "desc" },
      omit: { imagePublicId: true },
    });
  });
});

describe("findProjectById", () => {
  it("returns the project when found", async () => {
    prismaMock.project.findUnique.mockResolvedValue(mockProject);

    const result = await projectService.findProjectById("1");

    expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toEqual(mockProject);
  });

  it("returns null when not found", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    const result = await projectService.findProjectById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("findProjectBySlug", () => {
  it("returns the project when found, omitting imagePublicId", async () => {
    prismaMock.project.findUnique.mockResolvedValue(mockProject);

    const result = await projectService.findProjectBySlug("osk-backend");

    expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { slug: "osk-backend" },
      omit: { imagePublicId: true },
    });
    expect(result).toEqual(mockProject);
  });

  it("returns null when not found", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    const result = await projectService.findProjectBySlug("nonexistent");

    expect(result).toBeNull();
  });
});

describe("addProject", () => {
  it("creates and returns a new project", async () => {
    prismaMock.project.create.mockResolvedValue(mockProject);
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ghDescription: _ghDescription,
      ghLanguage: _ghLanguage,
      ghTopics: _ghTopics,
      ghStars: _ghStars,
      ghForks: _ghForks,
      ghOpenIssues: _ghOpenIssues,
      ghContributors: _ghContributors,
      ghPullRequests: _ghPullRequests,
      ghPushedAt: _ghPushedAt,
      lastFetchedAt: _lastFetchedAt,
      ...input
    } = mockProject;

    const result = await projectService.addProject(input);

    expect(prismaMock.project.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(mockProject);
  });
});

describe("updateProject", () => {
  it("updates and returns the project", async () => {
    const updated = { ...mockProject, tagline: "Updated tagline" };
    prismaMock.project.update.mockResolvedValue(updated);

    const result = await projectService.updateProject("1", {
      tagline: "Updated tagline",
    });

    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { tagline: "Updated tagline" },
    });
    expect(result).toEqual(updated);
  });
});

describe("deleteProject", () => {
  it("deletes the project by id", async () => {
    prismaMock.project.delete.mockResolvedValue(mockProject);

    await projectService.deleteProject("1");

    expect(prismaMock.project.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});

describe("findAllProjectsForRefresh", () => {
  it("selects only id, slug, repoOwner and repoName", async () => {
    const refreshRows = [
      {
        id: "1",
        slug: "osk-backend",
        repoOwner: "Open-Source-Kigali",
        repoName: "osk-backend",
      },
    ];
    prismaMock.project.findMany.mockResolvedValue(refreshRows as never);

    const result = await projectService.findAllProjectsForRefresh();

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      select: { id: true, slug: true, repoOwner: true, repoName: true },
    });
    expect(result).toEqual(refreshRows);
  });
});

describe("applyGithubSnapshot", () => {
  it("maps the snapshot onto the project's gh* fields and stamps lastFetchedAt", async () => {
    const snapshot: RepoSnapshot = {
      description: "Backend for Open Source Kigali",
      language: "TypeScript",
      topics: ["typescript", "express", "prisma"],
      stars: 24,
      forks: 78,
      openIssues: 52,
      contributors: 33,
      pullRequests: 5,
      pushedAt: new Date("2026-08-01T00:00:00Z"),
    };
    prismaMock.project.update.mockResolvedValue(mockProject);

    const result = await projectService.applyGithubSnapshot("1", snapshot);

    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: {
        ghDescription: snapshot.description,
        ghLanguage: snapshot.language,
        ghTopics: snapshot.topics,
        ghStars: snapshot.stars,
        ghForks: snapshot.forks,
        ghOpenIssues: snapshot.openIssues,
        ghContributors: snapshot.contributors,
        ghPullRequests: snapshot.pullRequests,
        ghPushedAt: snapshot.pushedAt,
        lastFetchedAt: expect.any(Date),
      },
    });
    expect(result).toEqual(mockProject);
  });
});
