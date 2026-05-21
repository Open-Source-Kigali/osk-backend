import fs from "fs/promises";
import path from "path";
import { gh } from "./github.service";

const CONTRIBUTORS_JSON_PATH = path.join(process.cwd(), "contributors.json");
const CONTRIBUTORS_MD_PATH = path.join(process.cwd(), "CONTRIBUTORS.md");

export interface ContributorProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
}

export type ContributorRefreshResult = {
  totalParsed: number;
  success: number;
  failures: number;
  failedList: Array<{ login: string; error: string }>;
};

export async function readContributors(): Promise<ContributorProfile[]> {
  try {
    const data = await fs.readFile(CONTRIBUTORS_JSON_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error("Failed to read contributors data: " + message);
  }
}

export async function refreshContributors(): Promise<ContributorRefreshResult> {
  const mdRaw = await fs.readFile(CONTRIBUTORS_MD_PATH, "utf-8");

  const usernames = mdRaw
    .split("\n")
    .map((line) => line.trim().replace(/^[-*+]?\s*/, ""))
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
      const data = (await res.json()) as Record<string, unknown>;
      return {
        login: String(data.login),
        name: data.name ? String(data.name) : String(data.login),
        avatarUrl: String(data.avatar_url),
        profileUrl: String(data.html_url),
        bio: data.bio ? String(data.bio) : "",
        company: data.company ? String(data.company) : "",
      } as ContributorProfile;
    }),
  );

  const contributors: ContributorProfile[] = [];
  const successful: string[] = [];
  const failed: Array<{ login: string; error: string }> = [];

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    const result = results[i];
    if (result.status === "fulfilled") {
      contributors.push(result.value);
      successful.push(username);
    } else {
      const error =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      failed.push({ login: username, error });
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
