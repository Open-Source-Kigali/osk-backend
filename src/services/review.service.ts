import { prisma } from "../config/prisma";
import { Review } from "../generated/prisma/client";

async function findAll() {
  return prisma.review.findMany();
}

async function findById(id: string) {
  return prisma.review.findUnique({ where: { id } });
}

async function create(
  reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.review.create({ data: reviewData });
}

async function update(
  id: string,
  reviewData: Partial<Omit<Review, "id" | "createdAt" | "updatedAt">>,
) {
  return prisma.review.update({ where: { id }, data: reviewData });
}

async function deleteReview(id: string) {
  return prisma.review.delete({ where: { id } });
}

export default {
  findAll,
  findById,
  create,
  update,
  delete: deleteReview,
};
