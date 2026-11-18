import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../config/prisma";
import { Review, ReviewStatus } from "../generated/prisma/client";
import reviewService from "./review.service";

const migrationSql = readFileSync(
  path.join(
    process.cwd(),
    "prisma/migrations/20261020131000_add_review_moderation/migration.sql",
  ),
  "utf8",
);

const baseReview = {
  id: "review-1",
  name: "Aline",
  profileUrl: "https://example.com/aline.png",
  profilePublicId: "reviews/aline",
  role: "Contributor",
  message: "OSK helped me ship.",
  status: ReviewStatus.PENDING,
  reviewedAt: null,
  reviewedById: null,
  createdAt: new Date("2026-01-02"),
  updatedAt: new Date("2026-01-02"),
} as Review;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("review moderation migration", () => {
  it("backfills existing reviews to APPROVED and defaults new rows to PENDING", () => {
    const backfill = migrationSql.indexOf(
      'UPDATE "Review" SET "status" = \'APPROVED\' WHERE "status" IS NULL;',
    );
    const pendingDefault = migrationSql.indexOf(
      'ALTER TABLE "Review" ALTER COLUMN "status" SET DEFAULT \'PENDING\';',
    );

    expect(migrationSql).toContain(
      "CREATE TYPE \"ReviewStatus\" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')",
    );
    expect(backfill).toBeGreaterThan(-1);
    expect(pendingDefault).toBeGreaterThan(backfill);
    expect(migrationSql.indexOf("SET NOT NULL")).toBeGreaterThan(backfill);
    expect(migrationSql.indexOf("SET NOT NULL")).toBeLessThan(pendingDefault);
  });
});

describe("review service public reads", () => {
  it("returns only approved reviews, newest first", async () => {
    const approved = [
      {
        ...baseReview,
        id: "new",
        status: ReviewStatus.APPROVED,
        createdAt: new Date("2026-02-02"),
      },
      {
        ...baseReview,
        id: "old",
        status: ReviewStatus.APPROVED,
        createdAt: new Date("2026-01-01"),
      },
    ] as Review[];

    vi.spyOn(prisma.review, "findMany").mockResolvedValue(approved);

    const reviews = await reviewService.findApprovedReviews();

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
    });
    expect(reviews.map((review) => review.id)).toEqual(["new", "old"]);
  });

  it("loads a public review only when it is approved", async () => {
    vi.spyOn(prisma.review, "findFirst").mockResolvedValue(null);

    const review = await reviewService.findApprovedReviewById("review-1");

    expect(review).toBeNull();
    expect(prisma.review.findFirst).toHaveBeenCalledWith({
      where: { id: "review-1", status: ReviewStatus.APPROVED },
    });
  });
});

describe("review service submissions", () => {
  it("stores a public submission as PENDING and ignores extra status input", async () => {
    vi.spyOn(prisma.review, "create").mockResolvedValue({
      ...baseReview,
      status: ReviewStatus.PENDING,
    } as Review);

    await reviewService.addReview({
      name: "Aline",
      role: "Contributor",
      message: "OSK helped me ship.",
      profileUrl: "https://example.com/aline.png",
      profilePublicId: "reviews/aline",
    });

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: {
        name: "Aline",
        role: "Contributor",
        message: "OSK helped me ship.",
        profileUrl: "https://example.com/aline.png",
        profilePublicId: "reviews/aline",
        status: ReviewStatus.PENDING,
      },
    });
  });
});

describe("review service moderation transitions", () => {
  it("approves a pending review and records the moderator", async () => {
    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      status: ReviewStatus.PENDING,
    } as never);
    vi.spyOn(prisma.review, "update").mockResolvedValue({
      ...baseReview,
      status: ReviewStatus.APPROVED,
      reviewedBy: { id: "admin-1", name: "Admin" },
    } as never);

    const result = await reviewService.setReviewStatus(
      "review-1",
      ReviewStatus.APPROVED,
      "admin-1",
    );

    expect(result.ok).toBe(true);
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "review-1" },
        data: expect.objectContaining({
          status: ReviewStatus.APPROVED,
          reviewedById: "admin-1",
        }),
      }),
    );
  });

  it("rejects an approved review", async () => {
    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      status: ReviewStatus.APPROVED,
    } as never);
    vi.spyOn(prisma.review, "update").mockResolvedValue({
      ...baseReview,
      status: ReviewStatus.REJECTED,
    } as never);

    const result = await reviewService.setReviewStatus(
      "review-1",
      ReviewStatus.REJECTED,
      "admin-1",
    );

    expect(result.ok).toBe(true);
  });

  it("allows a rejected review to be approved later", async () => {
    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      status: ReviewStatus.REJECTED,
    } as never);
    vi.spyOn(prisma.review, "update").mockResolvedValue({
      ...baseReview,
      status: ReviewStatus.APPROVED,
    } as never);

    const result = await reviewService.setReviewStatus(
      "review-1",
      ReviewStatus.APPROVED,
      "admin-1",
    );

    expect(result.ok).toBe(true);
  });

  it("refuses a no-op or a return to PENDING", async () => {
    vi.spyOn(prisma.review, "findUnique").mockResolvedValue({
      status: ReviewStatus.APPROVED,
    } as never);
    const update = vi.spyOn(prisma.review, "update");

    const sameStatus = await reviewService.setReviewStatus(
      "review-1",
      ReviewStatus.APPROVED,
      "admin-1",
    );
    const backToPending = await reviewService.setReviewStatus(
      "review-1",
      ReviewStatus.PENDING,
      "admin-1",
    );

    expect(sameStatus).toEqual({
      ok: false,
      code: "invalid_transition",
      from: ReviewStatus.APPROVED,
      to: ReviewStatus.APPROVED,
    });
    expect(backToPending).toEqual({
      ok: false,
      code: "invalid_transition",
      from: ReviewStatus.APPROVED,
      to: ReviewStatus.PENDING,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns not_found without updating a missing review", async () => {
    vi.spyOn(prisma.review, "findUnique").mockResolvedValue(null);
    const update = vi.spyOn(prisma.review, "update");

    const result = await reviewService.setReviewStatus(
      "missing",
      ReviewStatus.APPROVED,
      "admin-1",
    );

    expect(result).toEqual({ ok: false, code: "not_found" });
    expect(update).not.toHaveBeenCalled();
  });
});
