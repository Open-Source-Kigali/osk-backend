import { prisma } from '../config/prisma';

export const reviewService = {
  async findAll() {
    return prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async findById(id: string) {
    return prisma.review.findUnique({ where: { id } });
  },

  async create(data: {
    name: string;
    profileUrl: string;
    profilePublicId: string;
    role: string;
    message: string;
  }) {
    return prisma.review.create({ data });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      profileUrl: string;
      profilePublicId: string;
      role: string;
      message: string;
    }>,
  ) {
    return prisma.review.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.review.delete({ where: { id } });
  },
};
