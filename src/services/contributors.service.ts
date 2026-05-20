import { promises as fs } from "fs";
import path from "path";
import { gh } from "./github.service";

const CONTRIBUTORS_MD = path.resolve(process.cwd(), "CONTRIBUTORS.md");
const CONTRIBUTORS_JSON = path.resolve(process.cwd(), "contributors.json");

export type ContributorProfile = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
};

export type ContributorRefreshResult = {
  login: string;
  ok: boolean;
  error?: string;
};

function parseContributorUsernames(contents: string) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 && !line.startsWith("<!--") && !line.startsWith("#"),
    );
}

async function fetchContributorProfile(login: string) {
  const response = await gh(`/users/${login}`);
  const profile = (await response.json()) as {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    company: string | null;
  };

  return {
    login: profile.login,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    profileUrl: profile.html_url,
    bio: profile.bio,
    company: profile.company,
  };
}

export async function readContributors(): Promise<ContributorProfile[]> {
  const raw = await fs.readFile(CONTRIBUTORS_JSON, "utf-8");
  return JSON.parse(raw) as ContributorProfile[];
}

export async function refreshContributors(): Promise<ContributorRefreshResult[]> {
  const contributorsMd = await fs.readFile(CONTRIBUTORS_MD, "utf-8");
  const usernames = parseContributorUsernames(contributorsMd);

  const results = await Promise.allSettled(
    usernames.map(async (login) => {
      const profile = await fetchContributorProfile(login);
      return profile;
    }),
  );

  const summary: ContributorRefreshResult[] = [];
  const profiles: ContributorProfile[] = [];

  for (let idx = 0; idx < results.length; idx += 1) {
    const login = usernames[idx];
    const result = results[idx];

    if (result.status === "fulfilled") {
      profiles.push(result.value);
      summary.push({ login, ok: true });
      continue;
    }

    const error = result.reason instanceof Error ? result.reason.message : String(result.reason);
    if (error.includes("GitHub 404")) {
      summary.push({ login, ok: false, error: "GitHub user not found" });
      continue;
    }

    summary.push({ login, ok: false, error });
  }

  await fs.writeFile(CONTRIBUTORS_JSON, `${JSON.stringify(profiles, null, 2)}\n`, "utf-8");
  return summary;
}

export default { readContributors, refreshContributors };