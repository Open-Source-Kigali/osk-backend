import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import express from "express";
import { UserRole } from "../generated/prisma/client";
import response from "../utils/response";
import { errorHandler } from "./error.middleware";

vi.mock("../services/auth.service", () => ({
  default: {
    getSessionUser: vi.fn(),
    verifyCsrfToken: vi.fn(),
  },
}));

vi.mock("../config/env", async () => {
  const actual =
    await vi.importActual<typeof import("../config/env")>("../config/env");
  return {
    env: {
      ...actual.env,
      corsOrigins: ["http://localhost:5173"],
      nodeEnv: "test",
      redisUrl: "",
      cookieSecure: false,
      cookieSameSite: "lax" as const,
      sessionTtlSeconds: 3600,
    },
  };
});

import authService from "../services/auth.service";
import { requireAdminRead, requireAdminWrite } from "./admin-auth.middleware";

const ORIGIN = "http://localhost:5173";
const adminUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: UserRole.ADMIN,
};

function createApp() {
  const app = express();
  app.use(express.json());

  let mutated = false;

  app.get("/admin-read", ...requireAdminRead, (_req, res) => {
    response.success(res, { ok: true }, 200, "read");
  });

  app.post("/admin-write", ...requireAdminWrite, (_req, res) => {
    mutated = true;
    response.success(res, { ok: true }, 200, "write");
  });

  app.get("/mutated", (_req, res) => {
    response.success(res, { mutated }, 200, "state");
  });

  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAdminRead", () => {
  it("allows a valid admin session without CSRF", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "s1",
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const res = await request(createApp())
      .get("/admin-read")
      .set("Cookie", "osk_session=token");

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });

  it("rejects a missing session", async () => {
    const res = await request(createApp()).get("/admin-read");
    expect(res.status).toBe(401);
  });
});

describe("requireAdminWrite", () => {
  it("rejects x-api-key alone", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/admin-write")
      .set("Origin", ORIGIN)
      .set("x-api-key", "test-admin-key")
      .send({});

    expect(res.status).toBe(401);
    expect((await request(app).get("/mutated")).body.data.mutated).toBe(false);
  });

  it("rejects a valid session without CSRF and does not mutate", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "s1",
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const app = createApp();
    const res = await request(app)
      .post("/admin-write")
      .set("Origin", ORIGIN)
      .set("Cookie", "osk_session=token")
      .send({});

    expect(res.status).toBe(403);
    expect((await request(app).get("/mutated")).body.data.mutated).toBe(false);
  });

  it("rejects a non-admin authenticated user", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue(null);

    const res = await request(createApp())
      .post("/admin-write")
      .set("Origin", ORIGIN)
      .set("Cookie", "osk_session=token")
      .set("X-CSRF-Token", "csrf")
      .send({});

    expect(res.status).toBe(401);
  });

  it("allows a valid admin session with CSRF", async () => {
    vi.mocked(authService.getSessionUser).mockResolvedValue({
      user: adminUser,
      session: {
        id: "s1",
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    vi.mocked(authService.verifyCsrfToken).mockResolvedValue(true);

    const app = createApp();
    const res = await request(app)
      .post("/admin-write")
      .set("Origin", ORIGIN)
      .set("Cookie", "osk_session=token")
      .set("X-CSRF-Token", "csrf")
      .send({});

    expect(res.status).toBe(200);
    expect((await request(app).get("/mutated")).body.data.mutated).toBe(true);
  });

  it("rejects an untrusted origin", async () => {
    const res = await request(createApp())
      .post("/admin-write")
      .set("Origin", "https://evil.example")
      .set("Cookie", "osk_session=token")
      .set("X-CSRF-Token", "csrf")
      .send({});

    expect(res.status).toBe(403);
    expect(authService.getSessionUser).not.toHaveBeenCalled();
  });
});
