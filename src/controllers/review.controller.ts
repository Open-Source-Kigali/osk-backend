import { Request, Response, NextFunction } from "express";
import { Prisma, Review } from "../generated/prisma/client";
import reviewService from "../services/review.service";
import response from "../utils/response";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import trimStrings from "../utils/trim-strings";

type ReviewBody = Omit<Review, "id" | "createdAt" | "updatedAt">;

type CreateReviewBody = Omit<ReviewBody, "profileUrl" | "profilePublicId">;

type UpdateReviewBody = Partial<
  Omit<ReviewBody, "profileUrl" | "profilePublicId">
>;

async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.findAll();
    return response.success(
      res,
      reviews,
      200,
      "Reviews retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function findById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const review = await reviewService.findById(req.params.id);
    if (!review) {
      return response.failure(res, "Review not found", 404);
    }
    return response.success(res, review, 200, "Review retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function create(
  req: Request<unknown, unknown, CreateReviewBody>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return response.failure(res, "Profile image is required", 400);
  }

  let publicId: string | undefined;
  try {
    const uploaded = await uploadBuffer(
      req.file.buffer,
      "open-source-kigali/reviews",
    );
    publicId = uploaded.public_id;

    const data = trimStrings(req.body as CreateReviewBody);
    const newReview = await reviewService.create({
      ...data,
      profileUrl: uploaded.secure_url,
      profilePublicId: uploaded.public_id,
    });

    return response.success(res, newReview, 201, "Review created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function update(
  req: Request<{ id: string }, unknown, UpdateReviewBody>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await reviewService.findById(req.params.id);
    if (!existing) return response.failure(res, "Review not found", 404);

    const trimmedBody = trimStrings(req.body as UpdateReviewBody);
    const data = Object.fromEntries(
      Object.entries(trimmedBody).filter(
        ([, value]) => value !== "" && value !== undefined,
      ),
    ) as Prisma.ReviewUpdateInput;

    if (req.file) {
      const uploaded = await uploadBuffer(
        req.file.buffer,
        "open-source-kigali/reviews",
      );
      newPublicId = uploaded.public_id;
      data.profileUrl = uploaded.secure_url;
      data.profilePublicId = uploaded.public_id;
    }

    const updatedReview = await reviewService.update(req.params.id, data);

    if (req.file && existing.profilePublicId) {
      await destroyImage(existing.profilePublicId);
    }

    return response.success(
      res,
      updatedReview,
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
    const existing = await reviewService.findById(req.params.id);
    if (!existing) return response.failure(res, "Review not found", 404);

    await reviewService.delete(req.params.id);
    if (existing.profilePublicId) await destroyImage(existing.profilePublicId);

    return response.success(res, null, 204, "Review deleted successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  findAll,
  findById,
  create,
  update,
  delete: deleteReview,
};
