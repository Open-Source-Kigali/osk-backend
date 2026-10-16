import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { UserRole } from "../generated/prisma/client";

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
import authService from "../services/auth.service";

const ORIGIN = "http://localhost:5173";

const adminUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: UserRole.ADMIN,
};

function cookieHeader(token = "session-token") {
  return `osk_session=${token}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("sets an HttpOnly session cookie and returns safe user data", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      ok: true,
      sessionToken: "raw-session-token",
      payload: {
        user: adminUser,
        expiresAt: "2026-10-16T20:00:00.000Z",
        csrfToken: "csrf-token-value",
      },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "admin@example.com", password: "long-enough-password" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toEqual(adminUser);
    expect(res.body.data.csrfToken).toBe("csrf-token-value");
    expect(JSON.stringify(res.body)).not.toContain("raw-session-token");
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
    const setCookie = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
    expect(setCookie.join(";")).toMatch(/osk_session=/);
    expect(setCookie.join(";")).toMatch(/HttpOnly/i);
    expect(setCookie.join(";")).not.toMatch(/Secure/i);
  });

  it("returns a generic 401 for invalid credentials", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      ok: false,
      reason: "invalid_credentials",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "admin@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: "Invalid email or password",
      data: null,
    });
  });

  it("rate limits repeated failed login attempts", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      ok: false,
      reason: "invalid_credentials",
    });

    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Origin", ORIGIN)
        .set("X-Forwarded-For", "203.0.113.50")
        .send({
          email: "ratelimit@example.com",
          password: "wrong-password",
        });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });

  it("rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "admin@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("rejects untrusted origins", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example")
      .send({ email: "admin@example.com", password: "long-enough-password" });

    expect(res.status).toBe(403);
    expect(authService.login).not.toHaveBeenCalled();
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated admin identity", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "sess-1",
        userId: adminUser.id,
        expiresAt: new Date("2026-10-16T20:00:00.000Z"),
      },
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual(adminUser);
    expect(JSON.stringify(res.body)).not.toContain("password");
  });

  it("returns 401 without a session cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 for an invalid session", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue(null);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeader("expired"));

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/csrf", () => {
  it("issues a session-bound CSRF token", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "sess-1",
        userId: adminUser.id,
        expiresAt: new Date("2026-10-16T20:00:00.000Z"),
      },
    });
    vi.mocked(authService.getCsrfToken).mockResolvedValue("fresh-csrf");

    const res = await request(app)
      .get("/api/auth/csrf")
      .set("Cookie", cookieHeader());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ csrfToken: "fresh-csrf" });
  });
});

describe("POST /api/auth/logout", () => {
  it("requires a valid CSRF token, revokes the session, and clears the cookie", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "sess-1",
        userId: adminUser.id,
        expiresAt: new Date("2026-10-16T20:00:00.000Z"),
      },
    });
    vi.mocked(authService.verifyCsrfToken).mockResolvedValue(true);
    vi.mocked(authService.logout).mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Origin", ORIGIN)
      .set("Cookie", cookieHeader())
      .set("X-CSRF-Token", "fresh-csrf");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
    expect(authService.logout).toHaveBeenCalled();
    const setCookie = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
    expect(setCookie.join(";")).toMatch(/osk_session=;/);
  });

  it("rejects logout without a CSRF token", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "sess-1",
        userId: adminUser.id,
        expiresAt: new Date("2026-10-16T20:00:00.000Z"),
      },
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Origin", ORIGIN)
      .set("Cookie", cookieHeader());

    expect(res.status).toBe(403);
    expect(authService.logout).not.toHaveBeenCalled();
  });
});

describe("Phase 2 compatibility with API-key admin auth", () => {
  it("still rejects admin mutations without x-api-key", async () => {
    const res = await request(app).delete("/api/members/1");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Admin access required");
  });
});
