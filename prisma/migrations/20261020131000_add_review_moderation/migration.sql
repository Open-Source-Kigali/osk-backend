-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Existing published testimonials stay visible. Add the column nullable, backfill
-- every current row to APPROVED, then require the column and default new inserts to PENDING.
-- AlterTable
ALTER TABLE "Review" ADD COLUMN "status" "ReviewStatus";

UPDATE "Review" SET "status" = 'APPROVED' WHERE "status" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "status" SET NOT NULL;

ALTER TABLE "Review" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "Review" ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT;

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_reviewedById_idx" ON "Review"("reviewedById");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
