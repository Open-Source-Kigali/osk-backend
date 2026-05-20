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

const mockEvent = {
  id: "1",
  title: "Event 1",
  tagline: "Tagline 1",
  imageUrl: "http://example.com/image.png",
  description: "Description 1",
  category: "Workshop",
  mode: "IN_PERSON",
  featured: false,
  capacity: 100,
  registered: 10,
  date: new Date("2026-06-01T10:00:00Z"),
  endDate: new Date("2026-06-01T12:00:00Z"),
  timeLabel: "10:00 AM - 12:00 PM",
  location: "Kigali",
  speakers: ["Speaker 1"],
  registerUrl: "http://example.com/register",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => mockReset(prismaMock));

describe("findAllEvents", () => {
  it("returns all events sorted by date ascending", async () => {
    prismaMock.event.findMany.mockResolvedValue([mockEvent]);

    const result = await eventService.findAllEvents();

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      orderBy: { date: "asc" },
      select: expect.any(Object),
    });
    expect(result).toEqual([mockEvent]);
  });
});

describe("findEventByIdSafe", () => {
  it("returns the event when found", async () => {
    prismaMock.event.findUnique.mockResolvedValue(mockEvent);

    const result = await eventService.findEventByIdSafe("1");

    expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: expect.any(Object),
    });
    expect(result).toEqual(mockEvent);
  });
});
