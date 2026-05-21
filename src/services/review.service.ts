import { prisma } from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";

export async function findAll() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.review.findUnique({
    where: { id },
  });
}

export async function create(data: Prisma.ReviewCreateInput) {
  return prisma.review.create({
    data,
  });
}

export async function update(id: string, data: Prisma.ReviewUpdateInput) {
  return prisma.review.update({
    where: { id },
    data,
  });
}

export async function deleteReview(id: string) {
  return prisma.review.delete({
    where: { id },
  });
}
