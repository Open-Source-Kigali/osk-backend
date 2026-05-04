import { env } from "../config/env";

export type RepoSnapshot = {
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  contributors: number;
  pullRequests: number;
  pushedAt: Date | null;
};

const API = "https://api.github.com";

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "oskbackend",
  };
  if (env.githubToken) h.Authorization = `Bearer ${env.githubToken}`;
  return h;
}

async function gh(path: string) {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} on ${path}: ${await res.text()}`);
  }
  return res;
}

async function fetchContributorCount(owner: string, name: string) {
  const res = await gh(
    `/repos/${owner}/${name}/contributors?per_page=1&anon=true`,
  );
  const link = res.headers.get("link");
  const match = link?.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  if (match) return Number(match[1]);
  const body = (await res.json()) as unknown[];
  return Array.isArray(body) ? body.length : 0;
}

async function fetchPullRequestCount(owner: string, name: string) {
  const q = encodeURIComponent(`repo:${owner}/${name} is:pr`);
  const res = await gh(`/search/issues?q=${q}&per_page=1`);
  const body = (await res.json()) as { total_count?: number };
  return body.total_count ?? 0;
}

export async function fetchRepoSnapshot(
  owner: string,
  name: string,
): Promise<RepoSnapshot> {
  const repoRes = await gh(`/repos/${owner}/${name}`);
  const repo = (await repoRes.json()) as {
    description: string | null;
    language: string | null;
    topics?: string[];
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    pushed_at: string | null;
  };

  const [contributors, pullRequests] = await Promise.all([
    fetchContributorCount(owner, name),
    fetchPullRequestCount(owner, name),
  ]);

  return {
    description: repo.description,
    language: repo.language,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    contributors,
    pullRequests,
    pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
  };
}
