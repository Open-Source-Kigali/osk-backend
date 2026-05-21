import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/event.service");
vi.mock("../utils/cloudinary-upload", () => ({
  uploadBuffer: vi.fn().mockResolvedValue({
    secure_url: "https://example.com/image.jpg",
    public_id: "abc123",
  }),
  destroyImage: vi.fn(),
}));

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

describe("POST /api/events", () => {
  it("returns 400 when registered count exceeds capacity", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", ADMIN_KEY)
      .field("title", "Event")
      .field("description", "Desc")
      .field("category", "Cat")
      .field("location", "Loc")
      .field("date", "2024-01-01")
      .field("capacity", 10)
      .field("registered", 11)
      .attach("file", Buffer.from("test"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("registered cannot exceed capacity");
  });
});

describe("PUT /api/events/:id", () => {
  it("returns 400 when updated registered exceeds existing capacity", async () => {
    vi.mocked(eventService.findEventById).mockResolvedValue(mockEvent); // capacity 100

    const res = await request(app)
      .put("/api/events/1")
      .set("x-api-key", ADMIN_KEY)
      .send({ registered: 101 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("registered cannot exceed capacity");
  });
});
