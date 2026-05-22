import fs from "fs/promises";
import path from "path";
import { gh } from "./github.service";

const CONTRIBUTORS_JSON_PATH = path.join(process.cwd(), "contributors.json");
const CONTRIBUTORS_MD_PATH = path.join(process.cwd(), "CONTRIBUTORS.md");

export interface Contributor {
  login: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  bio: string;
  company: string;
}

export async function readContributors(): Promise<Contributor[]> {
  try {
    const data = await fs.readFile(CONTRIBUTORS_JSON_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error("Failed to read contributors data: " + message);
  }
}

export async function refreshContributors() {
  const mdRaw = await fs.readFile(CONTRIBUTORS_MD_PATH, "utf-8");

  const usernames = mdRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("<!--") &&
        !line.startsWith("#") &&
        !line.includes(" "),
    );

  const results = await Promise.allSettled(
    usernames.map(async (username) => {
      const res = await gh(`/users/${username}`);
      const data = await res.json();
      return {
        login: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        profileUrl: data.html_url,
        bio: data.bio || "",
        company: data.company || "",
      } as Contributor;
    }),
  );

  const contributors: Contributor[] = [];
  const successful: string[] = [];
  const failed: Array<{ login: string; error: string }> = [];

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    const result = results[i];
    if (result.status === "fulfilled") {
      contributors.push(result.value);
      successful.push(username);
    } else {
      failed.push({ login: username, error: result.reason.message });
    }
  }

  await fs.writeFile(
    CONTRIBUTORS_JSON_PATH,
    JSON.stringify(contributors, null, 2),
    "utf-8",
  );

  return {
    totalParsed: usernames.length,
    success: successful.length,
    failures: failed.length,
    failedList: failed,
  };
}
