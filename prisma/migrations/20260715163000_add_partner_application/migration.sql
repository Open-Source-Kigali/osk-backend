-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Pending', 'Contacted', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "PartnerApplication" (
    "id" TEXT NOT NULL,
    "organisationName" TEXT NOT NULL,
    "organisationLogoUrl" TEXT NOT NULL,
    "organisationLogoPublicId" TEXT NOT NULL,
    "organisationType" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "organisationSize" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "partnershipTier" TEXT NOT NULL,
    "organisationOffer" TEXT NOT NULL,
    "projectIdea" TEXT,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "agreedToTerms" BOOLEAN NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id")
);
