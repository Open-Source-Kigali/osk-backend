import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/member.service");
import memberService from "../services/member.service";

const ADMIN_KEY = "test-admin-key";

const mockMember = {
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  githubUsername: "alice",
  orgName: "OSK",
  joinReason: "Love OSS",
  codingLevel: "intermediate",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => vi.resetAllMocks());

describe("GET /api/members", () => {
  it("returns 200 with a list of members", async () => {
    vi.mocked(memberService.findAllMembers).mockResolvedValue([mockMember]);

    const res = await request(app).get("/api/members");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });
});

describe("GET /api/members/:id", () => {
  it("returns 200 when the member exists", async () => {
    vi.mocked(memberService.findMemberById).mockResolvedValue(mockMember);

    const res = await request(app).get("/api/members/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("1");
  });

  it("returns 404 when the member does not exist", async () => {
    vi.mocked(memberService.findMemberById).mockResolvedValue(null);

    const res = await request(app).get("/api/members/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/members", () => {
  it("returns 201 with the created member", async () => {
    vi.mocked(memberService.addMember).mockResolvedValue(mockMember);

    const res = await request(app).post("/api/members").send({
      name: "Alice",
      email: "alice@example.com",
      githubUsername: "alice",
      orgName: "OSK",
      joinReason: "Love OSS",
      codingLevel: "intermediate",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe("PUT /api/members/:id", () => {
  it("returns 403 without admin key", async () => {
    const res = await request(app).put("/api/members/1").send({ name: "Bob" });

    expect(res.status).toBe(403);
  });

  it("returns 200 with valid admin key", async () => {
    vi.mocked(memberService.findMemberById).mockResolvedValue(mockMember);
    vi.mocked(memberService.updateMember).mockResolvedValue({
      ...mockMember,
      name: "Bob",
    });

    const res = await request(app)
      .put("/api/members/1")
      .set("x-api-key", ADMIN_KEY)
      .send({ name: "Bob" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Bob");
  });
});

describe("DELETE /api/members/:id", () => {
  it("returns 403 without admin key", async () => {
    const res = await request(app).delete("/api/members/1");

    expect(res.status).toBe(403);
  });

  it("returns 204 with valid admin key", async () => {
    vi.mocked(memberService.findMemberById).mockResolvedValue(mockMember);
    vi.mocked(memberService.deleteMember).mockResolvedValue(mockMember);

    const res = await request(app)
      .delete("/api/members/1")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(204);
  });
});
