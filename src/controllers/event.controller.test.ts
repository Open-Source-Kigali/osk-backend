import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/event.service");
import eventService from "../services/event.service";

const ADMIN_KEY = "test-admin-key";

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

describe("PUT /api/events/:id", () => {
  it("returns 400 when registered would exceed capacity", async () => {
    vi.mocked(eventService.findEventById).mockResolvedValue(mockEvent);

    const res = await request(app)
      .put("/api/events/1")
      .set("x-api-key", ADMIN_KEY)
      .send({
        registered: 101,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Registered count cannot exceed capacity");
    expect(vi.mocked(eventService.updateEvent)).not.toHaveBeenCalled();
  });
});
