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
  title: "OSK Meetup",
  tagline: "Community event",
  imageUrl: "https://example.com/image.jpg",
  imagePublicId: "abc123",
  description: "An open-source meetup",
  category: "community",
  mode: "in-person",
  featured: true,
  capacity: 100,
  registered: 30,
  date: new Date(),
  endDate: new Date(),
  timeLabel: "10:00 AM",
  location: "Kigali",
  speakers: ["Alice"],
  registerUrl: "https://example.com/register",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => mockReset(prismaMock));

describe("findAllEvents", () => {
  it("returns all events when no featured filter is given", async () => {
    prismaMock.event.findMany.mockResolvedValue([mockEvent]);

    const result = await eventService.findAllEvents();

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { date: "asc" },
      omit: { imagePublicId: true },
    });
    expect(result).toEqual([mockEvent]);
  });

  it("returns only featured events when featured is true", async () => {
    prismaMock.event.findMany.mockResolvedValue([mockEvent]);

    const result = await eventService.findAllEvents(true);

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      where: { featured: true },
      orderBy: { date: "asc" },
      omit: { imagePublicId: true },
    });
    expect(result).toEqual([mockEvent]);
  });

  it("returns an empty list when no events match", async () => {
    prismaMock.event.findMany.mockResolvedValue([]);

    const result = await eventService.findAllEvents(true);

    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      where: { featured: true },
      orderBy: { date: "asc" },
      omit: { imagePublicId: true },
    });
    expect(result).toEqual([]);
  });
});

describe("findEventById", () => {
  it("returns the event when found, omitting imagePublicId", async () => {
    prismaMock.event.findUnique.mockResolvedValue(mockEvent);

    const result = await eventService.findEventById("1");

    expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      omit: { imagePublicId: true },
    });
    expect(result).toEqual(mockEvent);
  });

  it("returns null when not found", async () => {
    prismaMock.event.findUnique.mockResolvedValue(null);

    const result = await eventService.findEventById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("findEventByIdInternal", () => {
  it("returns the event when found, without omitting imagePublicId", async () => {
    prismaMock.event.findUnique.mockResolvedValue(mockEvent);

    const result = await eventService.findEventByIdInternal("1");

    expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toEqual(mockEvent);
  });

  it("returns null when not found", async () => {
    prismaMock.event.findUnique.mockResolvedValue(null);

    const result = await eventService.findEventByIdInternal("nonexistent");

    expect(result).toBeNull();
  });
});

describe("addEvent", () => {
  it("creates and returns a new event", async () => {
    prismaMock.event.create.mockResolvedValue(mockEvent);
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...input
    } = mockEvent;

    const result = await eventService.addEvent(input);

    expect(prismaMock.event.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(mockEvent);
  });
});

describe("updateEvent", () => {
  it("updates and returns the event", async () => {
    const updated = { ...mockEvent, title: "OSK Hackathon" };
    prismaMock.event.update.mockResolvedValue(updated);

    const result = await eventService.updateEvent("1", {
      title: "OSK Hackathon",
    });

    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { title: "OSK Hackathon" },
    });
    expect(result).toEqual(updated);
  });
});

describe("deleteEvent", () => {
  it("deletes the event by id", async () => {
    prismaMock.event.delete.mockResolvedValue(mockEvent);

    await eventService.deleteEvent("1");

    expect(prismaMock.event.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});
