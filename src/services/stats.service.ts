import { prisma } from "../config/prisma";
import { readContributors } from "./contributors.service";

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

  const contributorsData = await readContributors();
  const contributors = contributorsData.length;

  return {
    contributors,
    members,
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
