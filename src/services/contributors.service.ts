import fs from "fs/promises";
import path from "path";
import { gh } from "./github.service";

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
  status: "saved" | "skipped" | "failed";
  error: string | null;
};

export type ContributorRefreshSummary = {
  total: number;
  saved: number;
  skipped: number;
  failed: number;
  results: ContributorRefreshResult[];
};

const ROOT_DIR = path.resolve(__dirname, "../../");
const CONTRIBUTORS_JSON_PATH = path.join(ROOT_DIR, "contributors.json");
const CONTRIBUTORS_MD_PATH = path.join(ROOT_DIR, "CONTRIBUTORS.md");
const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

function isCommentLine(line: string) {
  return line.trimStart().startsWith("<!--");
}

function extractContributorLogins(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isCommentLine(line))
    .filter((line) => GITHUB_USERNAME_RE.test(line));
}

async function readContributorProfilesFile() {
  const raw = await fs.readFile(CONTRIBUTORS_JSON_PATH, "utf8");
  return JSON.parse(raw) as ContributorProfile[];
}

async function fetchContributorProfile(login: string) {
  const res = await gh(`/users/${encodeURIComponent(login)}`);
  const profile = (await res.json()) as {
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
  } satisfies ContributorProfile;
}

async function readContributors() {
  return readContributorProfilesFile();
}

async function refreshContributors() {
  const markdown = await fs.readFile(CONTRIBUTORS_MD_PATH, "utf8");
  const logins = extractContributorLogins(markdown);

  const settled = await Promise.allSettled(
    logins.map(async (login) => {
      try {
        const profile = await fetchContributorProfile(login);
        return {
          login,
          profile,
          status: "saved" as const,
          error: null,
        };
      } catch (err) {
        const status =
          typeof err === "object" && err !== null
            ? (err as { status?: number }).status
            : undefined;
        if (status === 404) {
          return {
            login,
            profile: null,
            status: "skipped" as const,
            error: null,
          };
        }

        return {
          login,
          profile: null,
          status: "failed" as const,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  const results: ContributorRefreshResult[] = [];
  const profiles: ContributorProfile[] = [];

  for (const item of settled) {
    if (item.status === "fulfilled") {
      results.push({
        login: item.value.login,
        status: item.value.status,
        error: item.value.error,
      });
      if (item.value.status === "saved" && item.value.profile) {
        profiles.push(item.value.profile);
      }
      continue;
    }

    results.push({
      login: "unknown",
      status: "failed",
      error:
        item.reason instanceof Error
          ? item.reason.message
          : String(item.reason),
    });
  }

  await fs.writeFile(
    CONTRIBUTORS_JSON_PATH,
    `${JSON.stringify(profiles, null, 2)}\n`,
  );

  const summary: ContributorRefreshSummary = {
    total: logins.length,
    saved: results.filter((r) => r.status === "saved").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };

  return summary;
}

export default {
  readContributors,
  refreshContributors,
};
