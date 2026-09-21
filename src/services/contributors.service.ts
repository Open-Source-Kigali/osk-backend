import fs from "fs/promises";
import path from "path";
import { gh } from "./github.service";

const CONTRIBUTORS_JSON_PATH = path.join(process.cwd(), "contributors.json");

const OSK_OWNER = "Open-Source-Kigali";
const OSK_REPO = "osk-backend";

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

async function fetchContributorLogins(): Promise<string[]> {
  const res = await gh(
    `/repos/${OSK_OWNER}/${OSK_REPO}/contributors?per_page=100`,
  );
  const data = (await res.json()) as { login?: string }[];
  const logins = data
    .map((c) => c.login)
    .filter((login): login is string => Boolean(login));
  return [...new Set(logins)];
}

export async function refreshContributors() {
  const usernames = await fetchContributorLogins();

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
