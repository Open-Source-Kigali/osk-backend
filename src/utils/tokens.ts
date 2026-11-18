import { createHash, randomBytes, timingSafeEqual } from "crypto";

const TOKEN_BYTES = 32;

export function generateOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokensEqual(left: string, right: string): boolean {
  const leftHash = Buffer.from(hashToken(left), "hex");
  const rightHash = Buffer.from(hashToken(right), "hex");
  if (leftHash.length !== rightHash.length) return false;
  return timingSafeEqual(leftHash, rightHash);
}
