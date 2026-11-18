import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { CodingLevel, UserRole } from "../generated/prisma/client";

vi.mock("../services/member.service");
vi.mock("../services/auth.service", () => ({
  default: {
    INVALID_CREDENTIALS: "Invalid email or password",
    login: vi.fn(),
    getSessionUser: vi.fn(),
    getCsrfToken: vi.fn(),
    verifyCsrfToken: vi.fn(),
    logout: vi.fn(),
  },
}));

import app from "../app";
import memberService from "../services/member.service";
import authService from "../services/auth.service";

const ORIGIN = "http://localhost:5173";
const SESSION_COOKIE = "osk_session=test-session-token";
const CSRF_TOKEN = "test-csrf-token";

const adminUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: UserRole.ADMIN,
};

const mockMember = {
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  githubUsername: "alice",
  orgName: "OSK",
  joinReason: "Love OSS",
  codingLevel: CodingLevel.intermediate,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockValidAdminSession() {
  vi.mocked(authService.getSessionUser).mockResolvedValue({
    user: adminUser,
    session: {
      id: "sess-1",
      userId: adminUser.id,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  vi.mocked(authService.verifyCsrfToken).mockResolvedValue(true);
}

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
  it("returns 201 with the created member without admin auth", async () => {
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
    expect(authService.getSessionUser).not.toHaveBeenCalled();
  });
});

describe("PUT /api/members/:id", () => {
  it("returns 401 without a session", async () => {
    const res = await request(app)
      .put("/api/members/1")
      .set("Origin", ORIGIN)
      .send({ name: "Bob" });

    expect(res.status).toBe(401);
    expect(memberService.updateMember).not.toHaveBeenCalled();
  });

  it("returns 401 when only an x-api-key is sent", async () => {
    const res = await request(app)
      .put("/api/members/1")
      .set("Origin", ORIGIN)
      .set("x-api-key", "test-admin-key")
      .send({ name: "Bob" });

    expect(res.status).toBe(401);
    expect(memberService.updateMember).not.toHaveBeenCalled();
  });

  it("returns 403 without a CSRF token", async () => {
    mockValidAdminSession();

    const res = await request(app)
      .put("/api/members/1")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .send({ name: "Bob" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("CSRF token required");
    expect(memberService.updateMember).not.toHaveBeenCalled();
  });

  it("returns 403 for an invalid CSRF token", async () => {
    mockValidAdminSession();
    vi.mocked(authService.verifyCsrfToken).mockResolvedValue(false);

    const res = await request(app)
      .put("/api/members/1")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", "bad-token")
      .send({ name: "Bob" });

    expect(res.status).toBe(403);
    expect(memberService.updateMember).not.toHaveBeenCalled();
  });

  it("returns 200 with a valid admin session and CSRF token", async () => {
    mockValidAdminSession();
    vi.mocked(memberService.findMemberById).mockResolvedValue(mockMember);
    vi.mocked(memberService.updateMember).mockResolvedValue({
      ...mockMember,
      name: "Bob",
    });

    const res = await request(app)
      .put("/api/members/1")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ name: "Bob" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Bob");
  });

  it("returns 404 when the member does not exist", async () => {
    mockValidAdminSession();
    vi.mocked(memberService.findMemberById).mockResolvedValue(null);

    const res = await request(app)
      .put("/api/members/nonexistent")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ name: "Nobody" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /api/members/:id", () => {
  it("returns 401 without a session", async () => {
    const res = await request(app)
      .delete("/api/members/1")
      .set("Origin", ORIGIN);

    expect(res.status).toBe(401);
  });

  it("returns 204 with a valid admin session and CSRF token", async () => {
    mockValidAdminSession();
    vi.mocked(memberService.findMemberById).mockResolvedValue(mockMember);
    vi.mocked(memberService.deleteMember).mockResolvedValue(mockMember);

    const res = await request(app)
      .delete("/api/members/1")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN);

    expect(res.status).toBe(204);
  });

  it("returns 404 when deleting a member that does not exist", async () => {
    mockValidAdminSession();
    vi.mocked(memberService.findMemberById).mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/members/nonexistent")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Member not found");
  });
});
