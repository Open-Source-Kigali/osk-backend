-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'in-person',
ADD COLUMN     "registerUrl" TEXT,
ADD COLUMN     "registered" INTEGER,
ADD COLUMN     "speakers" TEXT[],
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "timeLabel" TEXT;
