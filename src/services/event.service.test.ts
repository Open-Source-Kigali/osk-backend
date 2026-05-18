import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../generated/prisma/client";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

import { prisma } from "../config/prisma";
import eventService from "./event.service";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => mockReset(prismaMock));

describe("findAllEvents", () => {
  it("returns all events ordered by date when no featured filter is given", async () => {
    prismaMock.event.findMany.mockResolvedValue([]);

    const result = await eventService.findAllEvents();

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { date: "asc" },
    });
    expect(result).toEqual([]);
  });

  it("filters featured events when requested", async () => {
    prismaMock.event.findMany.mockResolvedValue([]);

    await eventService.findAllEvents(true);

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      where: { featured: true },
      orderBy: { date: "asc" },
    });
  });
});
