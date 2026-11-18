import { prisma } from "../config/prisma";
import { Prisma, Review, ReviewStatus } from "../generated/prisma/client";

const moderatorArgs = {
  include: {
    reviewedBy: {
      select: { id: true, name: true },
    },
  },
} satisfies Prisma.ReviewDefaultArgs;

export type ReviewWithModerator = Prisma.ReviewGetPayload<typeof moderatorArgs>;

type NewReviewInput = {
  name: string;
  role: string;
  message: string;
  profileUrl: string;
  profilePublicId: string;
};

type ReviewContentUpdate = {
  name?: string;
  role?: string;
  message?: string;
  profileUrl?: string;
  profilePublicId?: string;
};

const TRANSITIONS: Record<ReviewStatus, readonly ReviewStatus[]> = {
  [ReviewStatus.PENDING]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED],
  [ReviewStatus.APPROVED]: [ReviewStatus.REJECTED],
  [ReviewStatus.REJECTED]: [ReviewStatus.APPROVED],
};

export type ModerationUpdateResult =
  | { ok: true; review: ReviewWithModerator }
  | { ok: false; code: "not_found" }
  | {
      ok: false;
      code: "invalid_transition";
      from: ReviewStatus;
      to: ReviewStatus;
    };

async function findApprovedReviews(): Promise<Review[]> {
  return prisma.review.findMany({
    where: { status: ReviewStatus.APPROVED },
    orderBy: { createdAt: "desc" },
  });
}

async function findApprovedReviewById(id: string): Promise<Review | null> {
  return prisma.review.findFirst({
    where: { id, status: ReviewStatus.APPROVED },
  });
}

async function findReviewsByStatus(
  status: ReviewStatus,
): Promise<ReviewWithModerator[]> {
  return prisma.review.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    ...moderatorArgs,
  });
}

async function findReviewById(id: string): Promise<ReviewWithModerator | null> {
  return prisma.review.findUnique({
    where: { id },
    ...moderatorArgs,
  });
}

async function addReview(input: NewReviewInput): Promise<Review> {
  return prisma.review.create({
    data: {
      name: input.name,
      role: input.role,
      message: input.message,
      profileUrl: input.profileUrl,
      profilePublicId: input.profilePublicId,
      status: ReviewStatus.PENDING,
    },
  });
}

async function updateReview(
  id: string,
  reviewData: ReviewContentUpdate,
): Promise<ReviewWithModerator> {
  return prisma.review.update({
    where: { id },
    data: reviewData,
    ...moderatorArgs,
  });
}

async function setReviewStatus(
  id: string,
  status: ReviewStatus,
  reviewerId: string,
): Promise<ModerationUpdateResult> {
  const existing = await prisma.review.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existing) return { ok: false, code: "not_found" };

  const allowed = TRANSITIONS[existing.status];
  if (!allowed.includes(status)) {
    return {
      ok: false,
      code: "invalid_transition",
      from: existing.status,
      to: status,
    };
  }

  const review = await prisma.review.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedById: reviewerId,
    },
    ...moderatorArgs,
  });

  return { ok: true, review };
}

async function deleteReview(id: string): Promise<Review> {
  return prisma.review.delete({ where: { id } });
}

export default {
  findApprovedReviews,
  findApprovedReviewById,
  findReviewsByStatus,
  findReviewById,
  addReview,
  updateReview,
  setReviewStatus,
  deleteReview,
};
