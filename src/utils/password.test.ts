import { describe, expect, it } from "vitest";
import { hashPassword, isBcryptHash, verifyPassword } from "./password";

describe("password utils", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(isBcryptHash(hash)).toBe(true);
    expect(await verifyPassword("correct-horse-battery", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("never accepts plaintext or non-bcrypt stored values", async () => {
    expect(await verifyPassword("secret", "secret")).toBe(false);
    expect(await verifyPassword("secret", "not-a-hash")).toBe(false);
    expect(isBcryptHash("secret")).toBe(false);
  });
});
