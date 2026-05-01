/*
  Warnings:

  - Added the required column `category` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logoPublicId` to the `Partner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "logoPublicId" TEXT NOT NULL;
