-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'archived', 'paused');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "maintainer" TEXT,
    "langColor" TEXT,
    "ghDescription" TEXT,
    "ghLanguage" TEXT,
    "ghTopics" TEXT[],
    "ghStars" INTEGER NOT NULL DEFAULT 0,
    "ghForks" INTEGER NOT NULL DEFAULT 0,
    "ghOpenIssues" INTEGER NOT NULL DEFAULT 0,
    "ghContributors" INTEGER NOT NULL DEFAULT 0,
    "ghPullRequests" INTEGER NOT NULL DEFAULT 0,
    "ghPushedAt" TIMESTAMP(3),
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_repoOwner_repoName_key" ON "Project"("repoOwner", "repoName");
