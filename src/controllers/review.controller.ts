import { Request, Response, NextFunction } from "express";
import reviewService from "../services/review.service";
import response from "../utils/response";
import { Review, ReviewStatus } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import trimStrings from "../utils/trim-strings";
import { parseRequestBody } from "../utils/validation";
import {
  createReviewSchema,
  reviewListQuerySchema,
  reviewModerationSchema,
  updateReviewSchema,
} from "../schemas/review.schema";
import type { ReviewWithModerator } from "../services/review.service";

const FOLDER = "open-source-kigali/reviews";

const CLIENT_MODERATION_FIELDS = [
  "status",
  "reviewedAt",
  "reviewedById",
  "reviewedBy",
] as const;

function asBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return trimStrings(body as Record<string, unknown>);
  }
  return {};
}

function rejectsModerationOverride(
  body: Record<string, unknown>,
  res: Response,
): boolean {
  const attempted = CLIENT_MODERATION_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );
  if (!attempted) return false;

  response.failure(res, "Moderation status cannot be set by the client", 400);
  return true;
}

function withoutEmptyStrings(body: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== ""),
  );
}

function toPublicReview(review: Review) {
  return {
    id: review.id,
    name: review.name,
    profileUrl: review.profileUrl,
    profilePublicId: review.profilePublicId,
    role: review.role,
    message: review.message,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

function toAdminReview(review: ReviewWithModerator) {
  return {
    ...toPublicReview(review),
    status: review.status,
    reviewedAt: review.reviewedAt,
    reviewedBy: review.reviewedBy
      ? { id: review.reviewedBy.id, name: review.reviewedBy.name }
      : null,
  };
}

async function findAllReviews(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reviews = await reviewService.findApprovedReviews();
    response.success(
      res,
      reviews.map(toPublicReview),
      200,
      "Reviews retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function findReviewById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const review = await reviewService.findApprovedReviewById(req.params.id);
    if (!review) {
      return response.failure(res, "Review not found", 404);
    }
    return response.success(
      res,
      toPublicReview(review),
      200,
      "Review retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function addReview(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return response.failure(res, "Profile image file is required", 400);
  }

  const body = asBody(req.body);
  if (rejectsModerationOverride(body, res)) return;

  const data = parseRequestBody(createReviewSchema, body, res);
  if (!data) return;

  let publicId: string | undefined;
  try {
    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const newReview = await reviewService.addReview({
      name: data.name,
      role: data.role,
      message: data.message,
      profileUrl: uploaded.secure_url,
      profilePublicId: uploaded.public_id,
    });

    response.success(
      res,
      { ...toPublicReview(newReview), status: newReview.status },
      201,
      "Review submitted for moderation",
    );
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function updateReview(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const body = asBody(req.body);
  if (rejectsModerationOverride(body, res)) return;

  const data = parseRequestBody(
    updateReviewSchema,
    withoutEmptyStrings(body),
    res,
  );
  if (!data) return;

  let newPublicId: string | undefined;
  try {
    const existing = await reviewService.findReviewById(req.params.id);
    if (!existing) return response.failure(res, "Review not found", 404);

    const update: {
      name?: string;
      role?: string;
      message?: string;
      profileUrl?: string;
      profilePublicId?: string;
    } = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.role !== undefined) update.role = data.role;
    if (data.message !== undefined) update.message = data.message;

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      newPublicId = uploaded.public_id;
      update.profileUrl = uploaded.secure_url;
      update.profilePublicId = uploaded.public_id;
    }

    const updatedReview = await reviewService.updateReview(
      req.params.id,
      update,
    );

    if (req.file && existing.profilePublicId) {
      await destroyImage(existing.profilePublicId);
    }

    response.success(
      res,
      toAdminReview(updatedReview),
      200,
      "Review updated successfully",
    );
  } catch (err) {
    if (newPublicId) await destroyImage(newPublicId);
    next(err);
  }
}

async function deleteReview(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await reviewService.findReviewById(req.params.id);
    if (!existing) return response.failure(res, "Review not found", 404);

    await reviewService.deleteReview(req.params.id);
    if (existing.profilePublicId) await destroyImage(existing.profilePublicId);
    response.success(res, null, 204, "Review deleted successfully");
  } catch (err) {
    next(err);
  }
}

async function listReviewsForModeration(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = parseRequestBody(reviewListQuerySchema, req.query, res);
    if (!query) return;

    const status = query.status ?? ReviewStatus.PENDING;
    const reviews = await reviewService.findReviewsByStatus(status);
    response.success(
      res,
      reviews.map(toAdminReview),
      200,
      "Reviews retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function findReviewForModeration(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const review = await reviewService.findReviewById(req.params.id);
    if (!review) return response.failure(res, "Review not found", 404);

    return response.success(
      res,
      toAdminReview(review),
      200,
      "Review retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function setReviewModerationStatus(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.authUser) {
      return response.failure(res, "Authentication required", 401);
    }

    const data = parseRequestBody(
      reviewModerationSchema,
      asBody(req.body),
      res,
    );
    if (!data) return;

    const result = await reviewService.setReviewStatus(
      req.params.id,
      data.status,
      req.authUser.id,
    );

    if (!result.ok) {
      if (result.code === "not_found") {
        return response.failure(res, "Review not found", 404);
      }
      return response.failure(
        res,
        `Cannot change review status from ${result.from} to ${result.to}`,
        409,
      );
    }

    const message =
      result.review.status === ReviewStatus.APPROVED
        ? "Review approved successfully"
        : "Review rejected successfully";

    return response.success(res, toAdminReview(result.review), 200, message);
  } catch (err) {
    next(err);
  }
}

export default {
  findAllReviews,
  findReviewById,
  addReview,
  updateReview,
  deleteReview,
  listReviewsForModeration,
  findReviewForModeration,
  setReviewModerationStatus,
};
