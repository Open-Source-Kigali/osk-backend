import { describe, expect, it } from "vitest";
import { generateOpaqueToken, hashToken, tokensEqual } from "./tokens";

describe("token utils", () => {
  it("generates opaque tokens and stable hashes", () => {
    const token = generateOpaqueToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(tokensEqual(token, token)).toBe(true);
    expect(tokensEqual(token, generateOpaqueToken())).toBe(false);
  });
});
