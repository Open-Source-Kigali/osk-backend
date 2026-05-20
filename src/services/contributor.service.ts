import fs from "fs/promises";
import path from "path";
import { fetchUserProfile, UserProfile } from "./github.service";

async function findAllContributors(): Promise<UserProfile[]> {
  const filePath = path.join(process.cwd(), "CONTRIBUTORS.md");
  const content = await fs.readFile(filePath, "utf-8");

  const usernames = content
    .split("\n")
    .map((line) => line.trim())
    // Ignore headings, comments, blank lines, and empty strings
    .filter(
      (line) => line && !line.startsWith("#") && !line.startsWith("<!--"),
    );

  const profiles = await Promise.allSettled(
    usernames.map((username) => fetchUserProfile(username)),
  );

  return profiles
    .filter(
      (p): p is PromiseFulfilledResult<UserProfile> => p.status === "fulfilled",
    )
    .map((p) => p.value);
}

export default { findAllContributors };
