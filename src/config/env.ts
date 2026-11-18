import dotenv from "dotenv";

dotenv.config();

function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseSameSite(raw: string | undefined): "lax" | "strict" | "none" {
  const value = (raw || "lax").trim().toLowerCase();
  if (value === "strict" || value === "none" || value === "lax") {
    return value;
  }
  return "lax";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV || "development";
const cookieSameSite = parseSameSite(process.env.SESSION_COOKIE_SAMESITE);
const cookieSecureExplicit = process.env.SESSION_COOKIE_SECURE;

/**
 * Secure cookies are required in production. In development they default to
 * false so http://localhost works. Never force Secure=false in production via env.
 */
const cookieSecure =
  nodeEnv === "production"
    ? true
    : cookieSecureExplicit === undefined
      ? false
      : cookieSecureExplicit === "true";

if (cookieSameSite === "none" && !cookieSecure) {
  throw new Error(
    "SESSION_COOKIE_SAMESITE=none requires Secure cookies (production or SESSION_COOKIE_SECURE=true).",
  );
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/mydb",
  adminApiKey: process.env.ADMIN_API_KEY || "",
  redisUrl: process.env.REDIS_URL || "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  sessionTtlSeconds: parsePositiveInt(
    process.env.SESSION_TTL_SECONDS,
    60 * 60 * 8,
  ),
  cookieSameSite,
  cookieSecure,
};
