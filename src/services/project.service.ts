import { prisma } from "../config/prisma";
import { Prisma, Project } from "../generated/prisma/client";
import { RepoSnapshot } from "./github.service";

async function findAllProjects() {
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

async function findProjectById(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

async function findProjectBySlug(slug: string) {
  return prisma.project.findUnique({ where: { slug } });
}

async function addProject(
  data: Omit<
    Project,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "ghDescription"
    | "ghLanguage"
    | "ghTopics"
    | "ghStars"
    | "ghForks"
    | "ghOpenIssues"
    | "ghContributors"
    | "ghPullRequests"
    | "ghPushedAt"
    | "lastFetchedAt"
  >,
) {
  return prisma.project.create({ data });
}

async function updateProject(id: string, data: Prisma.ProjectUpdateInput) {
  return prisma.project.update({ where: { id }, data });
}

async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

async function findAllProjectsForRefresh() {
  return prisma.project.findMany({
    select: { id: true, slug: true, repoOwner: true, repoName: true },
  });
}

async function applyGithubSnapshot(id: string, snap: RepoSnapshot) {
  return prisma.project.update({
    where: { id },
    data: {
      ghDescription: snap.description,
      ghLanguage: snap.language,
      ghTopics: snap.topics,
      ghStars: snap.stars,
      ghForks: snap.forks,
      ghOpenIssues: snap.openIssues,
      ghContributors: snap.contributors,
      ghPullRequests: snap.pullRequests,
      ghPushedAt: snap.pushedAt,
      lastFetchedAt: new Date(),
    },
  });
}

export default {
  findAllProjects,
  findProjectById,
  findProjectBySlug,
  addProject,
  updateProject,
  deleteProject,
  findAllProjectsForRefresh,
  applyGithubSnapshot,
};
