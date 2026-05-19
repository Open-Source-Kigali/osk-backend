import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/event.service");
import eventService from "../services/event.service";

beforeEach(() => vi.resetAllMocks());

describe("GET /api/events", () => {
  it("passes featured=true to the service", async () => {
    vi.mocked(eventService.findAllEvents).mockResolvedValue([]);

    const res = await request(app).get("/api/events?featured=true");

    expect(res.status).toBe(200);
    expect(eventService.findAllEvents).toHaveBeenCalledWith(true);
  });
});

describe("POST /api/events", () => {
  it("rejects registered counts that exceed capacity", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", "test-admin-key")
      .field("title", "Launch Night")
      .field("description", "Community event")
      .field("category", "community")
      .field("date", "2026-05-19T00:00:00.000Z")
      .field("location", "Kigali")
      .field("capacity", "10")
      .field("registered", "12")
      .attach("file", Buffer.from("fake"), {
        filename: "event.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("registered cannot exceed capacity");
    expect(eventService.addEvent).not.toHaveBeenCalled();
  });

  it("rejects unsupported event modes", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", "test-admin-key")
      .field("title", "Launch Night")
      .field("description", "Community event")
      .field("category", "community")
      .field("date", "2026-05-19T00:00:00.000Z")
      .field("location", "Kigali")
      .field("mode", "banana")
      .attach("file", Buffer.from("fake"), {
        filename: "event.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "mode must be one of: in-person, online, hybrid",
    );
    expect(eventService.addEvent).not.toHaveBeenCalled();
  });
});

describe("PUT /api/events/:id", () => {
  it("rejects updates that would make registered exceed capacity", async () => {
    vi.mocked(eventService.findEventById).mockResolvedValue({
      id: "1",
      title: "Launch Night",
      tagline: null,
      imageUrl: "https://example.com/image.png",
      imagePublicId: "events/image",
      description: "Community event",
      category: "community",
      mode: "in-person",
      featured: false,
      capacity: 10,
      registered: 8,
      date: new Date("2026-05-19T00:00:00.000Z"),
      endDate: null,
      timeLabel: null,
      location: "Kigali",
      speakers: [],
      registerUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .put("/api/events/1")
      .set("x-api-key", "test-admin-key")
      .send({ registered: 12 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("registered cannot exceed capacity");
    expect(eventService.updateEvent).not.toHaveBeenCalled();
  });

  it("rejects updates with unsupported event modes", async () => {
    vi.mocked(eventService.findEventById).mockResolvedValue({
      id: "1",
      title: "Launch Night",
      tagline: null,
      imageUrl: "https://example.com/image.png",
      imagePublicId: "events/image",
      description: "Community event",
      category: "community",
      mode: "in-person",
      featured: false,
      capacity: 10,
      registered: 8,
      date: new Date("2026-05-19T00:00:00.000Z"),
      endDate: null,
      timeLabel: null,
      location: "Kigali",
      speakers: [],
      registerUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .put("/api/events/1")
      .set("x-api-key", "test-admin-key")
      .send({ mode: "banana" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "mode must be one of: in-person, online, hybrid",
    );
    expect(eventService.updateEvent).not.toHaveBeenCalled();
  });
});
