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

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => mockReset(prismaMock));

describe("findAllProjects", () => {
  it("returns all projects ordered by newest first when no featured filter is given", async () => {
    prismaMock.project.findMany.mockResolvedValue([]);

    const result = await projectService.findAllProjects();

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual([]);
  });

  it("filters featured projects when requested", async () => {
    prismaMock.project.findMany.mockResolvedValue([]);

    await projectService.findAllProjects(true);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
    });
  });
});
