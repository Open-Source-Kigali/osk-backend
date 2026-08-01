import { describe, it, expect, vi } from "vitest";
import { prisma } from "../config/prisma";
import { Review } from "../generated/prisma/client";
import reviewService from "./review.service";

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

    vi.spyOn(prisma.review, "findMany").mockResolvedValue(mockReviews);

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
});
