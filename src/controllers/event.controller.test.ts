import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/event.service");
import eventService from "../services/event.service";

const ADMIN_KEY = "test-admin-key";

const mockEvent = {
  id: "1",
  title: "Test Event",
  description: "Test Description",
  category: "Test Category",
  location: "Test Location",
  date: new Date().toISOString(),
  imageUrl: "https://example.com/image.jpg",
  imagePublicId: "image123",
};

beforeEach(() => vi.resetAllMocks());

describe("POST /api/events", () => {
  it("returns 400 when a required field (title) is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", ADMIN_KEY)
      .field("description", "desc")
      .field("category", "cat")
      .field("location", "loc")
      .field("date", "2024-01-01")
      .attach("file", Buffer.from("test"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("title is required");
  });

  it("returns 400 when a required field (date) is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", ADMIN_KEY)
      .field("title", "title")
      .field("description", "desc")
      .field("category", "cat")
      .field("location", "loc")
      .attach("file", Buffer.from("test"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("date is required");
  });

  it("returns 400 when a required field (description) is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", ADMIN_KEY)
      .field("title", "title")
      .field("category", "cat")
      .field("location", "loc")
      .field("date", "2024-01-01")
      .attach("file", Buffer.from("test"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("description is required");
  });

  it("returns 400 when a required field (category) is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", ADMIN_KEY)
      .field("title", "title")
      .field("description", "desc")
      .field("location", "loc")
      .field("date", "2024-01-01")
      .attach("file", Buffer.from("test"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("category is required");
  });

  it("returns 400 when a required field (location) is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("x-api-key", ADMIN_KEY)
      .field("title", "title")
      .field("description", "desc")
      .field("category", "cat")
      .field("date", "2024-01-01")
      .attach("file", Buffer.from("test"), "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("location is required");
  });
});
