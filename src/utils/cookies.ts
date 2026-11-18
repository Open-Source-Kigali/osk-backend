import type { CookieSerializeOptions } from "cookie";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import type { Request, Response } from "express";
import { env } from "../config/env";

export const SESSION_COOKIE_NAME = "osk_session";

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return parseCookie(header)[name];
}

export function sessionCookieOptions(
  maxAgeSeconds: number,
): CookieSerializeOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function setSessionCookie(
  res: Response,
  token: string,
  maxAgeSeconds: number,
) {
  res.appendHeader(
    "Set-Cookie",
    serializeCookie(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions(maxAgeSeconds),
    ),
  );
}

export function clearSessionCookie(res: Response) {
  res.appendHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      ...sessionCookieOptions(0),
      maxAge: 0,
    }),
  );
}
