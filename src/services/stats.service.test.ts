import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../generated/prisma/client";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

vi.mock("./github.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./github.service")>();
  return { ...actual, gh: vi.fn() };
});

import { prisma } from "../config/prisma";
import statsService from "./stats.service";
import { gh } from "./github.service";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;
const ghMock = vi.mocked(gh);

// Minimal Response-like object: stats.service only reads `.json()`.
const contributorsResponse = (logins: string[]): Response =>
  ({
    json: () => Promise.resolve(logins.map((login) => ({ login }))),
  }) as Response;

const mockTransaction = () =>
  prismaMock.$transaction.mockResolvedValue([
    120,
    3,
    2,
    4,
    5,
    { _sum: { ghPullRequests: 42 } },
  ]);

beforeEach(() => {
  mockReset(prismaMock);
  ghMock.mockReset();
});

describe("getStats contributors count", () => {
  it("counts each contributor once across all OSK repos", async () => {
    mockTransaction();

    ghMock
      .mockResolvedValueOnce(contributorsResponse(["alice", "bob"]))
      .mockResolvedValueOnce(contributorsResponse(["alice", "carol"]))
      .mockResolvedValueOnce(contributorsResponse(["carol"]))
      .mockResolvedValueOnce(contributorsResponse(["dave"]))
      .mockResolvedValueOnce(contributorsResponse([]))
      .mockResolvedValueOnce(contributorsResponse(["alice"]))
      .mockResolvedValueOnce(contributorsResponse(["eve"]));

    const stats = await statsService.getStats();

    expect(ghMock).toHaveBeenCalledTimes(7);
    expect(ghMock).toHaveBeenCalledWith(
      "/repos/Open-Source-Kigali/osk-backend/contributors?per_page=100",
    );
    expect(stats.contributors).toBe(5);
  });

  it("skips repos whose GitHub call failed", async () => {
    mockTransaction();

    ghMock
      .mockResolvedValueOnce(contributorsResponse(["alice", "bob"]))
      .mockRejectedValueOnce(new Error("GitHub rate limit exceeded"))
      .mockResolvedValueOnce(contributorsResponse(["alice", "carol"]))
      .mockResolvedValueOnce(contributorsResponse(["carol"]))
      .mockResolvedValueOnce(contributorsResponse(["dave"]))
      .mockResolvedValueOnce(contributorsResponse(["dave"]))
      .mockResolvedValueOnce(contributorsResponse(["eve"]));

    const stats = await statsService.getStats();

    expect(stats.contributors).toBe(5);
  });

  it("returns zero when every repo call fails", async () => {
    mockTransaction();

    ghMock.mockRejectedValue(new Error("GitHub rate limit exceeded"));

    const stats = await statsService.getStats();

    expect(stats.contributors).toBe(0);
  });

  it("excludes bot accounts ending with [bot]", async () => {
    mockTransaction();

    ghMock
      .mockResolvedValueOnce(
        contributorsResponse(["alice", "github-actions[bot]", "bob"]),
      )
      .mockResolvedValueOnce(contributorsResponse(["dependabot[bot]"]))
      .mockResolvedValueOnce(contributorsResponse(["alice"]))
      .mockResolvedValueOnce(contributorsResponse([]))
      .mockResolvedValueOnce(contributorsResponse(["renovate[bot]"]))
      .mockResolvedValueOnce(contributorsResponse(["carol"]))
      .mockResolvedValueOnce(contributorsResponse(["alice"]));

    const stats = await statsService.getStats();

    expect(stats.contributors).toBe(3);
  });
});

describe("getStats database stats", () => {
  it("returns members, projects, events, partners, reviews and pull requests from the transaction", async () => {
    prismaMock.$transaction.mockResolvedValue([
      150,
      7,
      3,
      2,
      6,
      { _sum: { ghPullRequests: 24 } },
    ]);

    ghMock.mockResolvedValue(contributorsResponse(["alice"]));

    const stats = await statsService.getStats();

    expect(stats.members).toBe(300);
    expect(stats.projects).toBe(7);
    expect(stats.events).toBe(3);
    expect(stats.partners).toBe(2);
    expect(stats.reviews).toBe(6);
    expect(stats.pullRequests).toBe(24);
  });
});
