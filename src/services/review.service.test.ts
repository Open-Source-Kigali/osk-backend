import { describe, it, expect } from "vitest";
import { prisma } from "../config/prisma";
import { PrismaClient, Review } from "../generated/prisma/client";
import reviewService from "./review.service";
import type { DeepMockProxy } from "vitest-mock-extended";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});
const prismaMock = prisma as DeepMockProxy<PrismaClient>;
describe("Review Service", () => {
  const mockReviews = [
    {
      id: "1",
      createdAt: new Date("2026-01-02"),
    },
    {
      id: "2",
      createdAt: new Date("2026-01-01"),
    },
  ] as Review[];

  it("should return newest reviews first", async () => {
    prismaMock.review.findMany.mockResolvedValue(mockReviews);

    const reviews = await reviewService.findAllReviews();

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(reviews[0].createdAt.getTime()).toBeGreaterThan(
      reviews[1].createdAt.getTime(),
    );
  });

  it("should find review by id", async () => {
    prismaMock.review.findUnique.mockResolvedValue(mockReviews[0]);
    const results = await reviewService.findReviewById("1");

    expect(prisma.review.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(results).toEqual(mockReviews[0]);
  });

  it("should create a new review", async () => {
    prismaMock.review.create.mockResolvedValue(mockReviews[0]);
    await reviewService.addReview(mockReviews[0]);
    expect(prisma.review.create).toHaveBeenCalledWith({
      data: mockReviews[0],
    });
  });

  it("should update the review", async () => {
    prismaMock.review.update.mockResolvedValue(mockReviews[0]);
    await reviewService.updateReview("1", { name: "hello world" });
    expect(prisma.review.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { name: "hello world" },
    });
  });

  it("should delete review", async () => {
    prismaMock.review.delete.mockResolvedValue(mockReviews[0]);
    await reviewService.deleteReview("1");
    expect(prisma.review.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});
