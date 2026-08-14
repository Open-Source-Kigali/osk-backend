import { prisma } from "../config/prisma";
import { Review, Prisma } from "../generated/prisma/client";
import buildSearchFilter from "../utils/Search";

async function findAllReviews(search?: string): Promise<Review[]> {
  return prisma.review.findMany({
    where: buildSearchFilter<Prisma.ReviewWhereInput>(search, [
      "name",
      "message",
    ]),
    orderBy: { createdAt: "desc" },
  });
}

async function findReviewById(id: string): Promise<Review | null> {
  return prisma.review.findUnique({ where: { id } });
}

async function addReview(
  reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">,
): Promise<Review> {
  return prisma.review.create({ data: reviewData });
}

async function updateReview(
  id: string,
  reviewData: Partial<
    Omit<Review, "id" | "createdAt" | "updatedAt" | "profilePublicId">
  >,
): Promise<Review> {
  return prisma.review.update({ where: { id }, data: reviewData });
}

async function deleteReview(id: string): Promise<Review> {
  return prisma.review.delete({ where: { id } });
}

export default {
  findAllReviews,
  findReviewById,
  addReview,
  updateReview,
  deleteReview,
};
