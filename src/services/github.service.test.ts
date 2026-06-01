import { afterEach, describe, expect, it, vi } from "vitest";
import { GitHubError, gh } from "./github.service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gh", () => {
  it("throws a rate limit hint for exhausted GitHub API quota", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("API rate limit exceeded", {
          status: 403,
          headers: { "x-ratelimit-remaining": "0" },
        }),
      ),
    );

    await expect(gh("/repos/org/repo")).rejects.toMatchObject({
      name: "GitHubError",
      status: 403,
      message: expect.stringContaining("GitHub rate limit exceeded"),
    });
  });

  it("keeps the status and response body for non-rate-limit errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 })),
    );

    await expect(gh("/repos/org/missing")).rejects.toEqual(
      new GitHubError(404, "GitHub 404 on /repos/org/missing: Not Found"),
    );
  });
});
