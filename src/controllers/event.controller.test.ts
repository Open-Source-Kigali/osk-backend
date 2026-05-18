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
