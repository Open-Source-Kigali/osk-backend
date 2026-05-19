import { prisma } from "../config/prisma";
import { Prisma, Project } from "../generated/prisma/client";
import { RepoSnapshot } from "./github.service";

// Public project responses include the rendered image URL but never the Cloudinary asset id.
const projectSafeSelect = {
  id: true,
  slug: true,
  repoOwner: true,
  repoName: true,
  imageUrl: true,
  tagline: true,
  category: true,
  status: true,
  featured: true,
  maintainer: true,
  langColor: true,
  ghDescription: true,
  ghLanguage: true,
  ghTopics: true,
  ghStars: true,
  ghForks: true,
  ghOpenIssues: true,
  ghContributors: true,
  ghPullRequests: true,
  ghPushedAt: true,
  lastFetchedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

async function findAllProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: projectSafeSelect,
  });
}

async function findProjectById(id: string) {
  return prisma.project.findUnique({ where: { id } });
}

async function findProjectBySlugSafe(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    select: projectSafeSelect,
  });
}

async function findProjectBySlug(slug: string) {
  return prisma.project.findUnique({ where: { slug } });
}

async function addProject(
  projectData: Omit<
    Project,
    | "id"
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
    | "createdAt"
    | "updatedAt"
  >,
) {
  return prisma.project.create({
    data: projectData,
    select: projectSafeSelect,
  });
}

async function updateProject(
  id: string,
  projectData: Prisma.ProjectUpdateInput,
) {
  return prisma.project.update({
    where: { id },
    data: projectData,
    select: projectSafeSelect,
  });
}

async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

async function findAllProjectsForRefresh() {
  return prisma.project.findMany({
    select: { id: true, repoOwner: true, repoName: true, slug: true },
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
    select: projectSafeSelect,
  });
}

export default {
  findAllProjects,
  findProjectById,
  findProjectBySlugSafe,
  findProjectBySlug,
  addProject,
  updateProject,
  deleteProject,
  findAllProjectsForRefresh,
  applyGithubSnapshot,
};
