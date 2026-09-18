import { prisma } from "../config/prisma";
import { gh } from "./github.service";

const OSK_REPOS = [
  "osk-backend",
  "osk-frontend",
  "first-contributions",
  "about-open_source_kigali",
  "nestify",
  "documentation",
  "HeathTech",
];

const MEMBERS_OFFSET = 150;

async function getContributorsCount(): Promise<number> {
  const results = await Promise.allSettled(
    OSK_REPOS.map((repo) =>
      gh(`/repos/Open-Source-Kigali/${repo}/contributors?per_page=100`).then(
        (r) => r.json() as Promise<{ login: string }[]>,
      ),
    ),
  );

  const logins = new Set<string>();
  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      result.value.forEach((c) => logins.add(c.login));
    }
  }
  return logins.size;
}

async function getStats() {
  const [members, projects, events, partners, reviews, prAggregate] =
    await prisma.$transaction([
      prisma.member.count(),
      prisma.project.count(),
      prisma.event.count(),
      prisma.partner.count(),
      prisma.review.count(),
      prisma.project.aggregate({ _sum: { ghPullRequests: true } }),
    ]);

  const contributors = await getContributorsCount();

  return {
    contributors,
    members: members + MEMBERS_OFFSET,
    projects,
    events,
    partners,
    reviews,
    pullRequests: prAggregate._sum.ghPullRequests || 0,
  };
}

export default {
  getStats,
};
