import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "../generated/prisma/client";

vi.mock("../config/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    adminSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../utils/password", () => ({
  verifyPassword: vi.fn(),
}));

import { prisma } from "../config/prisma";
import { verifyPassword } from "../utils/password";
import authService from "./auth.service";
import { hashToken } from "../utils/tokens";

const admin = {
  id: "u1",
  name: "Admin",
  email: "admin@example.com",
  password: "$2b$12$abcdefghijklmnopqrstuv",
  role: UserRole.ADMIN,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth.service login", () => {
  it("creates a session for a valid admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(admin as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(prisma.adminSession.create).mockResolvedValue({} as never);

    const result = await authService.login(
      "admin@example.com",
      "correct-password",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.user.email).toBe("admin@example.com");
    expect(result.sessionToken).toBeTruthy();
    expect(result.payload.csrfToken).toBeTruthy();
    expect(prisma.adminSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          tokenHash: hashToken(result.sessionToken),
          csrfTokenHash: hashToken(result.payload.csrfToken),
        }),
      }),
    );
  });

  it("rejects unknown emails with the same failure reason", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const result = await authService.login("missing@example.com", "anything");

    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(prisma.adminSession.create).not.toHaveBeenCalled();
  });

  it("rejects non-admin users even with a valid password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...admin,
      role: UserRole.USER,
    } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const result = await authService.login("admin@example.com", "correct");

    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(prisma.adminSession.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(admin as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const result = await authService.login("admin@example.com", "wrong");

    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
  });
});

describe("auth.service sessions", () => {
  it("rejects revoked and expired sessions", async () => {
    vi.mocked(prisma.adminSession.findUnique).mockResolvedValue({
      id: "s1",
      userId: "u1",
      tokenHash: "abc",
      csrfTokenHash: "def",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      createdAt: new Date(),
      lastSeenAt: null,
      user: {
        id: "u1",
        name: "Admin",
        email: "admin@example.com",
        role: UserRole.ADMIN,
      },
    } as never);

    expect(await authService.getSessionUser("token")).toBeNull();

    vi.mocked(prisma.adminSession.findUnique).mockResolvedValue({
      id: "s1",
      userId: "u1",
      tokenHash: "abc",
      csrfTokenHash: "def",
      expiresAt: new Date(Date.now() - 60_000),
      revokedAt: null,
      createdAt: new Date(),
      lastSeenAt: null,
      user: {
        id: "u1",
        name: "Admin",
        email: "admin@example.com",
        role: UserRole.ADMIN,
      },
    } as never);

    expect(await authService.getSessionUser("token")).toBeNull();
  });

  it("revokes a session on logout", async () => {
    const token = "logout-token";
    vi.mocked(prisma.adminSession.findUnique).mockResolvedValue({
      id: "s1",
      userId: "u1",
      tokenHash: hashToken(token),
      csrfTokenHash: "def",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      lastSeenAt: null,
      user: {
        id: "u1",
        name: "Admin",
        email: "admin@example.com",
        role: UserRole.ADMIN,
      },
    } as never);
    vi.mocked(prisma.adminSession.update).mockResolvedValue({} as never);

    expect(await authService.logout(token)).toBe(true);
    expect(prisma.adminSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1" },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });
});
