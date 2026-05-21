import { Prisma, Review } from "../generated/prisma/client";
import { prisma } from "../config/prisma";

export async function findAll(): Promise<Review[]> {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string): Promise<Review | null> {
  return prisma.review.findUnique({
    where: { id },
  });
}

export async function create(data: Prisma.ReviewCreateInput): Promise<Review> {
  return prisma.review.create({
    data,
  });
}

export async function update(
  id: string,
  data: Prisma.ReviewUpdateInput,
): Promise<Review> {
  return prisma.review.update({
    where: { id },
    data,
  });
}

export async function deleteReview(id: string): Promise<Review> {
  return prisma.review.delete({
    where: { id },
  });
}

export default {
  findAll,
  findById,
  create,
  update,
  delete: deleteReview,
};
