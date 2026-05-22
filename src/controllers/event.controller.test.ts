import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/event.service");
vi.mock("../utils/cloudinary-upload");
vi.mock("../middlewares/auth.middleware", () => ({
  default: {
    requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  },
}));

import eventService from "../services/event.service";

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
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(true);
  });

  it("returns 200 and fetches all events when featured is not provided", async () => {
    vi.mocked(eventService.findAllEvents).mockResolvedValue([mockEvent]);

    const res = await request(app).get("/api/events");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(vi.mocked(eventService.findAllEvents)).toHaveBeenCalledWith(
      undefined,
    );
  });
});

describe("PUT /api/events/:id - capacity/registered validation", () => {
  it("returns 400 when registered exceeds capacity in update payload", async () => {
    vi.mocked(eventService.findEventByIdInternal).mockResolvedValue(mockEvent);

    const res = await request(app).put("/api/events/1").send({
      capacity: "50",
      registered: "60",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when updated registered exceeds existing capacity", async () => {
    vi.mocked(eventService.findEventByIdInternal).mockResolvedValue({
      ...mockEvent,
      capacity: 50,
      registered: 10,
    });

    const res = await request(app).put("/api/events/1").send({
      registered: "60",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("registered cannot exceed capacity");
  });

  it("returns 400 when updated capacity is less than existing registered", async () => {
    vi.mocked(eventService.findEventByIdInternal).mockResolvedValue({
      ...mockEvent,
      capacity: 100,
      registered: 80,
    });

    const res = await request(app).put("/api/events/1").send({
      capacity: "50",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("registered cannot exceed capacity");
  });

  it("allows update when registered does not exceed capacity", async () => {
    vi.mocked(eventService.findEventByIdInternal).mockResolvedValue(mockEvent);
    vi.mocked(eventService.updateEvent).mockResolvedValue(mockEvent);

    const res = await request(app).put("/api/events/1").send({
      capacity: "100",
      registered: "50",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
