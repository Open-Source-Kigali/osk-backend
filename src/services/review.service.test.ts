import { PrismaClient } from "@prisma/client/extension";
import { beforeEach, it, vi, describe, expect } from "vitest";
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

describe("fetching reviews", () => {
  it("returns all reviews", async () => {
    prismaMock.review.findMany.mockResolvedValue(mockReviews);
    const results = await reviewService.findAllReviews();
    expect(prismaMock.review.findMany).toHaveBeenCalled();
    expect(results).toEqual(mockReviews);
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
