import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("Not Found Middleware", () => {
  it("returns status 404 when calling a non-existent URL", async () => {
    const res = await request(app).get("/api/this-does-not-exist");

    expect(res.status).toBe(404);
  });
});
