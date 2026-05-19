import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import type { DeepMockProxy } from "vitest-mock-extended";
import fs from "fs/promises";

vi.mock("fs/promises");

import contributorsService, {
  ContributorProfile,
  ContributorRefreshResult,
} from "./contributors.service";
import { gh } from "./github.service";

vi.mock("./github.service");

const mockContributorProfile: ContributorProfile = {
  login: "nick-lemy",
  name: "Nick Lemy",
  avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
  profileUrl: "https://github.com/nick-lemy",
  bio: "Open source enthusiast",
  company: "OSK",
};

const fsMock = fs as unknown as DeepMockProxy<typeof fs>;
const ghMock = gh as unknown as DeepMockProxy<typeof gh>;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("contributorsService.readContributors", () => {
  it("returns contributor profiles from contributors.json", async () => {
    fsMock.readFile.mockResolvedValue(
      JSON.stringify([mockContributorProfile]),
    );

    const result = await contributorsService.readContributors();

    expect(result).toEqual([mockContributorProfile]);
    expect(fsMock.readFile).toHaveBeenCalledWith(
      expect.stringContaining("contributors.json"),
      "utf8",
    );
  });

  it("returns empty array when contributors.json is empty", async () => {
    fsMock.readFile.mockResolvedValue("[]");

    const result = await contributorsService.readContributors();

    expect(result).toEqual([]);
  });
});

describe("contributorsService.refreshContributors", () => {
  it("fetches profiles for all valid GitHub usernames from CONTRIBUTORS.md", async () => {
    const markdown = `# Contributors

nick-lemy
another-user

<!-- comments are ignored -->
`;

    fsMock.readFile.mockResolvedValueOnce(markdown);
    ghMock.mockResolvedValue({
      json: vi.fn().mockResolvedValueOnce({
        login: "nick-lemy",
        name: "Nick Lemy",
        avatar_url: mockContributorProfile.avatarUrl,
        html_url: mockContributorProfile.profileUrl,
        bio: mockContributorProfile.bio,
        company: mockContributorProfile.company,
      }),
    } as any);
    ghMock.mockResolvedValue({
      json: vi.fn().mockResolvedValueOnce({
        login: "another-user",
        name: "Another User",
        avatar_url: "https://avatars.githubusercontent.com/u/654321?v=4",
        html_url: "https://github.com/another-user",
        bio: null,
        company: null,
      }),
    } as any);
    fsMock.writeFile.mockResolvedValue(undefined);

    const result = await contributorsService.refreshContributors();

    expect(result.total).toBe(2);
    expect(result.saved).toBeGreaterThanOrEqual(0);
    expect(fsMock.readFile).toHaveBeenCalledWith(
      expect.stringContaining("CONTRIBUTORS.md"),
      "utf8",
    );
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("contributors.json"),
      expect.any(String),
    );
  });

  it("skips invalid GitHub usernames", async () => {
    const markdown = `# Contributors

valid-username
!@#$invalid
another-valid

`;

    fsMock.readFile.mockResolvedValueOnce(markdown);
    fsMock.writeFile.mockResolvedValue(undefined);

    const result = await contributorsService.refreshContributors();

    expect(result.total).toBe(2); // only valid usernames
  });

  it("handles GitHub 404 errors by skipping", async () => {
    const markdown = `# Contributors

nonexistent-user
`;

    fsMock.readFile.mockResolvedValueOnce(markdown);
    const errorWith404 = new Error("Not found") as any;
    errorWith404.status = 404;
    ghMock.mockRejectedValueOnce(errorWith404);
    fsMock.writeFile.mockResolvedValue(undefined);

    const result = await contributorsService.refreshContributors();

    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("handles GitHub errors by marking as failed", async () => {
    const markdown = `# Contributors

some-user
`;

    fsMock.readFile.mockResolvedValueOnce(markdown);
    const networkError = new Error("Network error") as any;
    ghMock.mockRejectedValueOnce(networkError);
    fsMock.writeFile.mockResolvedValue(undefined);

    const result = await contributorsService.refreshContributors();

    expect(result.failed).toBe(1);
    expect(result.results[0].status).toBe("failed");
  });
});
