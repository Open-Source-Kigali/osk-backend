import fs from "fs/promises";
import path from "path";
import https from "https";

type ContributorProfile = Record<string, unknown> & {
  login: string;
  ok: boolean;
};

type GithubUser = Record<string, unknown>;

function parseContributors(content: string) {
  const lines = content.split(/\r?\n/);
  const usernames: string[] = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("<!--")) continue;
    if (line.startsWith("//")) continue;
    // ignore HTML comments closing line
    if (line.startsWith("-->") || line.endsWith("-->")) continue;
    // simple username-only lines
    usernames.push(line);
  }
  return usernames;
}

function fetchGithubUser(username: string): Promise<GithubUser | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: `/users/${encodeURIComponent(username)}`,
      method: "GET",
      headers: {
        "User-Agent": "osk-backend",
        Accept: "application/vnd.github+json",
      },
    } as const;

    const req = https.request(options, (res) => {
      const { statusCode } = res;
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          if (statusCode && statusCode >= 200 && statusCode < 300) {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.end();
  });
}

async function getContributors(): Promise<ContributorProfile[]> {
  const filePath = path.join(process.cwd(), "CONTRIBUTORS.md");
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    return [];
  }
  const usernames = parseContributors(content);
  const promises = usernames.map(async (u) => {
    const profile = await fetchGithubUser(u);
    if (!profile) return { login: u, ok: false };
    return { ...profile, ok: true } as ContributorProfile;
  });

  const results = await Promise.all(promises);
  return results;
}

export default { getContributors };
