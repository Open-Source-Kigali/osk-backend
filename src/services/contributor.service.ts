import https from "https";

type ContributorProfile = Record<string, unknown> & {
  login: string;
  ok: boolean;
};

type GithubUser = Record<string, unknown>;

const OSK_OWNER = "Open-Source-Kigali";
const OSK_REPO = "osk-backend";

function fetchContributorLogins(): Promise<string[]> {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: `/repos/${OSK_OWNER}/${OSK_REPO}/contributors?per_page=100`,
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
            const parsed = JSON.parse(raw) as Array<{ login?: string }>;
            resolve(
              parsed
                .map((u) => u.login)
                .filter((login): login is string => Boolean(login)),
            );
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      });
    });

    req.on("error", () => resolve([]));
    req.end();
  });
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
  const usernames = await fetchContributorLogins();

  const promises = usernames.map(async (u) => {
    const profile = await fetchGithubUser(u);
    if (!profile) return { login: u, ok: false };
    return { ...profile, ok: true } as ContributorProfile;
  });

  const results = await Promise.all(promises);
  return results;
}

export default { getContributors };
