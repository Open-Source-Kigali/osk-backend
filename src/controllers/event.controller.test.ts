import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/event.service");
vi.mock("../config/prisma", () => ({
  prisma: {
    event: {
      findFirst: vi.fn(),
    },
  },
}));
import eventService from "../services/event.service";
import { prisma } from "../config/prisma";

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
  endDate: null,
  timeLabel: "10:00 AM",
  location: "Kigali",
  speakers: ["Alice"],
  registerUrl: "https://example.com/register",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.resetAllMocks());

describe("GET /api/events", () => {
  it("returns 200 and filters featured events when featured=true is provided", async () => {
    vi.mocked(eventService.findAllEvents).mockResolvedValue([mockEvent]);

    const res = await request(app).get("/api/events?featured=true");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(
      true,
      undefined,
    );
  });
  it("returns 200 and fetches all events when featured is not provided", async () => {
    vi.mocked(eventService.findAllEvents).mockResolvedValue([mockEvent]);

    const res = await request(app).get("/api/events");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(
      undefined,
      undefined,
    );
  });
  it("returns 200 and filters events by category when category query param is provided", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue({
      category: "community",
    } as Awaited<ReturnType<typeof prisma.event.findFirst>>);
    vi.mocked(eventService.findAllEvents).mockResolvedValue([mockEvent]);
    const res = await request(app).get("/api/events?category=community");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(
      undefined,
      "community",
    );
  });

  it("returns 200 and filters events by category when category query parameter is provided", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue({
      category: "workshop",
    } as Awaited<ReturnType<typeof prisma.event.findFirst>>);
    vi.mocked(eventService.findAllEvents).mockResolvedValue([mockEvent]);
    const res = await request(app).get("/api/events?category=workshop");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(
      undefined,
      "workshop",
    );
  });
  it("returns 200 and filters by both featured and category when both parameters are provided", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue({
      category: "workshop",
    } as Awaited<ReturnType<typeof prisma.event.findFirst>>);
    vi.mocked(eventService.findAllEvents).mockResolvedValue([mockEvent]);

    const res = await request(app).get(
      "/api/events?featured=true&category=workshop",
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(
      true,
      "workshop",
    );
  });

  it("returns 400 when an invalid category query parameter is provided", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue(null);

    const res = await request(app).get("/api/events?category=invalid-category");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(vi.mocked(eventService.findAllEvents)).not.toHaveBeenCalled();
  });
});
