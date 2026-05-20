import { prisma } from "../config/prisma";
import { Review } from "../generated/prisma/client";

async function findAllReviews() {
  return prisma.review.findMany();
}

async function findReviewById(id: string) {
  return prisma.review.findUnique({ where: { id } });
}

async function addReview(
  reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.review.create({ data: reviewData });
}

async function updateReview(
  id: string,
  reviewData: Partial<
    Omit<Review, "id" | "createdAt" | "updatedAt" | "profilePublicId">
  >,
) {
  return prisma.review.update({ where: { id }, data: reviewData });
}

async function deleteReview(id: string) {
  return prisma.review.delete({ where: { id } });
}

export default {
  findAllReviews,
  findReviewById,
  addReview,
  updateReview,
  deleteReview,
};
