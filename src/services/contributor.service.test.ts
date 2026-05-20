import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import contributorService from "./contributor.service";
import * as githubService from "./github.service";

vi.mock("fs/promises");
vi.mock("./github.service");

describe("findAllContributors", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should parse usernames from CONTRIBUTORS.md and fetch profiles", async () => {
    const mockContent = `
# Contributors
<!-- comment -->

user1
  user2  

# Another heading
user3
    `;
    vi.mocked(fs.readFile).mockResolvedValue(mockContent);

    const mockProfile = {
      login: "user1",
      name: "User One",
      avatarUrl: "url",
      htmlUrl: "url",
      bio: "bio",
      location: "loc",
    };

    vi.mocked(githubService.fetchUserProfile).mockImplementation((username) => {
      if (
        username === "user1" ||
        username === "user2" ||
        username === "user3"
      ) {
        return Promise.resolve({ ...mockProfile, login: username });
      }
      return Promise.reject(new Error("Not found"));
    });

    const result = await contributorService.findAllContributors();

    expect(result).toHaveLength(3);
    expect(result[0].login).toBe("user1");
    expect(result[1].login).toBe("user2");
    expect(result[2].login).toBe("user3");
    expect(githubService.fetchUserProfile).toHaveBeenCalledTimes(3);
  });

  it("should handle failed fetches gracefully", async () => {
    const mockContent = "user1\nuser2";
    vi.mocked(fs.readFile).mockResolvedValue(mockContent);

    vi.mocked(githubService.fetchUserProfile).mockImplementation((username) => {
      if (username === "user1") {
        return Promise.resolve({
          login: "user1",
          name: "User One",
          avatarUrl: "url",
          htmlUrl: "url",
          bio: "bio",
          location: "loc",
        });
      }
      return Promise.reject(new Error("GitHub error"));
    });

    const result = await contributorService.findAllContributors();

    expect(result).toHaveLength(1);
    expect(result[0].login).toBe("user1");
  });
});
