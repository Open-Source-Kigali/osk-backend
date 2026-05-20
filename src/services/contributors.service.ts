import fs from "fs/promises";
import path from "path";
import { gh } from "./github.service";

const CONTRIBUTORS_JSON_PATH = path.join(process.cwd(), "contributors.json");
const CONTRIBUTORS_MD_PATH = path.join(process.cwd(), "CONTRIBUTORS.md");

export interface Contributor {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
}

export async function readContributors(): Promise<Contributor[]> {
  try {
    const data = await fs.readFile(CONTRIBUTORS_JSON_PATH, "utf8");
    return JSON.parse(data) as Contributor[];
  } catch {
    return [];
  }
}

export async function refreshContributors() {
  const mdData = await fs.readFile(CONTRIBUTORS_MD_PATH, "utf8");
  const lines = mdData.split("\n");

  const usernames: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("<!--")) continue;
    if (trimmed.includes(" ") || trimmed.startsWith("#")) continue; // Skip text blocks, headers, etc.
    if (/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      usernames.push(trimmed);
    }
  }

  const fetchPromises = usernames.map(async (username) => {
    try {
      const res = await gh(`/users/${username}`);
      const data = (await res.json()) as {
        login: string;
        name: string | null;
        avatar_url: string;
        html_url: string;
        bio: string | null;
        company: string | null;
      };

      const contributor: Contributor = {
        login: data.login,
        name: data.name || null,
        avatarUrl: data.avatar_url,
        profileUrl: data.html_url,
        bio: data.bio || null,
        company: data.company || null,
      };
      return contributor;
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("404")) {
        throw new Error(`User ${username} not found (404)`);
      }
      throw e;
    }
  });

  const results = await Promise.allSettled(fetchPromises);

  const contributors: Contributor[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      contributors.push(result.value);
      successCount++;
    } else {
      failCount++;
      console.error(result.reason);
    }
  }

  await fs.writeFile(
    CONTRIBUTORS_JSON_PATH,
    JSON.stringify(contributors, null, 2),
    "utf8",
  );

  return {
    success: successCount,
    failed: failCount,
    total: usernames.length,
  };
}
