import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../config/prisma";
import { PrismaClient, Review } from "../generated/prisma/client";
import { DeepMockProxy, mockReset } from "vitest-mock-extended";
import reviewService from "./review.service";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

const prismaMock = prisma as DeepMockProxy<PrismaClient>;
const mockReviews = [
  {
    id: "4",
    name: "Arnold jabo",
    profileUrl: "https://images.com/456",
    profilePublicId: "43",
    role: "user",
    message: "some random messages",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "40",
    name: "John Doe",
    profileUrl: "https://images.com/400",
    profilePublicId: "47",
    role: "user",
    message: "Lorem ipsum lorem ipsum",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "50",
    name: "jane doe",
    profileUrl: "https://images.com/600",
    profilePublicId: "73",
    role: "user",
    message: "Great Job!",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

beforeEach(() => mockReset(prismaMock));

describe("Review Service - findAllReviews", () => {
  it("should return newest reviews first", async () => {
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
    prismaMock.review.findMany.mockResolvedValue(mockReviews);

    const reviews = await reviewService.findAllReviews();

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });

    expect(reviews[0].createdAt.getTime()).toBeGreaterThan(
      reviews[1].createdAt.getTime(),
    );
  });

  it("returns only featured reviews", async () => {
    const featuredReviews = mockReviews.filter(
      (review) => review.featured === true,
    );
    prismaMock.review.findMany.mockResolvedValue(featuredReviews);
    const results = await reviewService.findAllReviews(true);

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
    });

    expect(results).toEqual(featuredReviews);
  });

  it("returns non featured reviews", async () => {
    const nonFeaturedReviews = mockReviews.filter(
      (review) => review.featured === false,
    );
    prismaMock.review.findMany.mockResolvedValue(nonFeaturedReviews);
    const results = await reviewService.findAllReviews(false);

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });

    expect(results).toEqual(nonFeaturedReviews);
  });

  it("returns all revies when featured flag is undfined", async () => {
    prismaMock.review.findMany.mockResolvedValue(mockReviews);
    const results = await reviewService.findAllReviews(undefined);

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
    expect(results).toEqual(mockReviews);
  });
});
