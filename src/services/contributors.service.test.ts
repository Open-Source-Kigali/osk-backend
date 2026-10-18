import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./github.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./github.service")>();
  return { ...actual, gh: vi.fn() };
});

vi.mock("fs/promises", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

import fs from "fs/promises";
import { gh } from "./github.service";
import { readContributors, refreshContributors } from "./contributors.service";

const ghMock = vi.mocked(gh);
const readFileMock = vi.mocked(fs.readFile);
const writeFileMock = vi.mocked(fs.writeFile);

// Minimal Response-like objects: the service only reads `.json()`.
const contributorsResponse = (logins: string[]): Response =>
  ({
    json: () => Promise.resolve(logins.map((login) => ({ login }))),
  }) as Response;

const userResponse = (overrides: Record<string, unknown>): Response =>
  ({
    json: () =>
      Promise.resolve({
        login: "alice",
        name: "Alice",
        avatar_url: "https://avatars.example/alice.png",
        html_url: "https://github.com/alice",
        bio: "Hello world",
        company: "ACME",
        ...overrides,
      }),
  }) as Response;

beforeEach(() => {
  ghMock.mockReset();
  readFileMock.mockReset();
  writeFileMock.mockReset();
});

describe("refreshContributors", () => {
  it("fetches contributor logins from the GitHub repository API", async () => {
    ghMock
      .mockResolvedValueOnce(contributorsResponse(["alice", "bob"]))
      .mockResolvedValueOnce(userResponse({ login: "alice" }))
      .mockResolvedValueOnce(
        userResponse({
          login: "bob",
          name: "Bob",
          bio: null,
          company: null,
        }),
      );
    writeFileMock.mockResolvedValue(undefined as never);

    const result = await refreshContributors();

    expect(ghMock).toHaveBeenNthCalledWith(
      1,
      "/repos/Open-Source-Kigali/osk-backend/contributors?per_page=100",
    );
    expect(result).toEqual({
      totalParsed: 2,
      success: 2,
      failures: 0,
      failedList: [],
    });
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });

  it("deduplicates contributor logins", async () => {
    // The repo contributors endpoint can list a login more than once; the
    // service must fetch its profile only once.
    ghMock
      .mockResolvedValueOnce(contributorsResponse(["alice", "alice", "bob"]))
      .mockResolvedValueOnce(userResponse({ login: "alice" }))
      .mockResolvedValueOnce(userResponse({ login: "bob" }));
    writeFileMock.mockResolvedValue(undefined as never);

    const result = await refreshContributors();

    expect(result.totalParsed).toBe(2);
    expect(ghMock).toHaveBeenCalledWith("/users/alice");
    expect(ghMock).toHaveBeenCalledWith("/users/bob");
  });

  it("reports failed profile lookups without aborting the refresh", async () => {
    ghMock
      .mockResolvedValueOnce(contributorsResponse(["alice", "ghost"]))
      .mockResolvedValueOnce(userResponse({ login: "alice" }))
      .mockRejectedValueOnce(new Error("GitHub 404 on /users/ghost"));
    writeFileMock.mockResolvedValue(undefined as never);

    const result = await refreshContributors();

    expect(result).toEqual({
      totalParsed: 2,
      success: 1,
      failures: 1,
      failedList: [{ login: "ghost", error: "GitHub 404 on /users/ghost" }],
    });
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });
});

describe("readContributors", () => {
  it("returns the contributors parsed from contributors.json", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([{ login: "alice", name: "Alice" }]),
    );

    const contributors = await readContributors();

    expect(contributors).toEqual([{ login: "alice", name: "Alice" }]);
  });

  it("throws a descriptive error when the file cannot be read", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT"));

    await expect(readContributors()).rejects.toThrow(
      "Failed to read contributors data: ENOENT",
    );
  });
});
