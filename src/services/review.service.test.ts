import { PrismaClient } from "@prisma/client/extension";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { Review } from "../generated/prisma/client";
import { DeepMockProxy, mockReset } from "vitest-mock-extended";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

import { prisma } from "../config/prisma";
import reviewService from "./review.service";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;
const mockReviews = [
  {
    id: "4",
    name: "Arnold jabo",
    profileUrl: "https://images.com/456",
    profilePublickId: "43",
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
    profilePublickId: "47",
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
    profilePublickId: "73",
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
    expect(prismaMock.review.findMany).toHaveBeenCalled();
    expect(results).toEqual(featuredReviews);
  });

  it("returns all revies when featured flag is undfined", async () => {
    prismaMock.review.findMany.mockResolvedValue(mockReviews);
    const results = await reviewService.findAllReviews(undefined);
    expect(prismaMock.review.findMany).toHaveBeenCalled();
    expect(results).toEqual(mockReviews);
  });
});
