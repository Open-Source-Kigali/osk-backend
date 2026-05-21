-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'in-person',
ADD COLUMN     "registerUrl" TEXT,
ADD COLUMN     "registered" INTEGER,
ADD COLUMN     "speakers" TEXT[],
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "timeLabel" TEXT;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "profilePublicId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
