import { timingSafeEqual } from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import type { AuthUser } from "../types/express";
import { verifyPassword } from "../utils/password";
import { generateOpaqueToken, hashToken } from "../utils/tokens";
import { UserRole } from "../generated/prisma/client";

const INVALID_CREDENTIALS = "Invalid email or password";

/** Valid bcrypt hash used only to keep missing-user login timing closer to a real verify. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";

export type PublicAuthPayload = {
  user: AuthUser;
  expiresAt: string;
  csrfToken: string;
};

async function findActiveSessionByToken(token: string) {
  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (session.user.role !== UserRole.ADMIN) return null;

  return session;
}

async function login(
  email: string,
  password: string,
): Promise<
  | { ok: true; sessionToken: string; payload: PublicAuthPayload }
  | { ok: false; reason: "invalid_credentials" }
> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-ish work when the user is missing: still run a bcrypt compare
  // against a dummy hash shape only when we have a candidate. Unknown emails
  // and failed verifies share the same client message.
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return { ok: false, reason: "invalid_credentials" };
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches || user.role !== UserRole.ADMIN) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const sessionToken = generateOpaqueToken();
  const csrfToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlSeconds * 1000);

  await prisma.adminSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(sessionToken),
      csrfTokenHash: hashToken(csrfToken),
      expiresAt,
    },
  });

  return {
    ok: true,
    sessionToken,
    payload: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      expiresAt: expiresAt.toISOString(),
      csrfToken,
    },
  };
}

async function getSessionUser(sessionToken: string): Promise<{
  user: AuthUser;
  session: { id: string; userId: string; expiresAt: Date };
} | null> {
  const session = await findActiveSessionByToken(sessionToken);
  if (!session) return null;

  return {
    user: session.user,
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    },
  };
}

async function getCsrfToken(sessionToken: string): Promise<string | null> {
  const session = await findActiveSessionByToken(sessionToken);
  if (!session) return null;

  // Rotate CSRF token on each fetch so the client always has a fresh value
  // without extending session expiry.
  const csrfToken = generateOpaqueToken();
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { csrfTokenHash: hashToken(csrfToken) },
  });
  return csrfToken;
}

async function verifyCsrfToken(
  sessionToken: string,
  csrfToken: string,
): Promise<boolean> {
  const session = await findActiveSessionByToken(sessionToken);
  if (!session) return false;

  const expected = Buffer.from(session.csrfTokenHash, "hex");
  const actual = Buffer.from(hashToken(csrfToken), "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

async function logout(sessionToken: string): Promise<boolean> {
  const session = await findActiveSessionByToken(sessionToken);
  if (!session) return false;

  await prisma.adminSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });
  return true;
}

export default {
  INVALID_CREDENTIALS,
  login,
  getSessionUser,
  getCsrfToken,
  verifyCsrfToken,
  logout,
  findActiveSessionByToken,
};
