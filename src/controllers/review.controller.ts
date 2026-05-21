import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { response } from '../utils/response';
import { uploadBuffer, destroyImage } from '../utils/cloudinary-upload';

const FOLDER = 'open-source-kigali/reviews';

const getReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await reviewService.findAll();
    return response.success(res, reviews);
  } catch (err) {
    return response.failure(res, 'Failed to fetch reviews', 500);
  }
};

const getReviewById = async (req: Request, res: Response) => {
  try {
    const review = await reviewService.findById(req.params.id);
    if (!review) return response.failure(res, 'Review not found', 404);
    return response.success(res, review);
  } catch (err) {
    return response.failure(res, 'Failed to fetch review', 500);
  }
};

const createReview = async (req: Request, res: Response) => {
  const { name, role, message } = req.body;
  const required = ['name', 'role', 'message'];
  for (const field of required) {
    if (!req.body[field as keyof typeof req.body]) {
      return response.failure(res, `${field} is required`, 400);
    }
  }

  if (!req.file) return response.failure(res, 'Profile image is required', 400);

  let uploaded: { url: string; public_id: string } | null = null;
  try {
    uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    const review = await reviewService.create({
      name,
      role,
      message,
      profileUrl: uploaded.url,
      profilePublicId: uploaded.public_id,
    });
    return response.success(res, review, 201);
  } catch (err) {
    if (uploaded) await destroyImage(uploaded.public_id);
    return response.failure(res, 'Failed to create review', 500);
  }
};

const updateReview = async (req: Request, res: Response) => {
  try {
    const existing = await reviewService.findById(req.params.id);
    if (!existing) return response.failure(res, 'Review not found', 404);

    const updates: Record<string, string> = {};
    for (const field of ['name', 'role', 'message'] as const) {
      if (req.body[field]) updates[field] = req.body[field];
    }

    let uploaded: { url: string; public_id: string } | null = null;
    if (req.file) {
      uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      updates.profileUrl = uploaded.url;
      updates.profilePublicId = uploaded.public_id;
    }

    try {
      const review = await reviewService.update(req.params.id, updates);
      if (req.file && uploaded) await destroyImage(existing.profilePublicId);
      return response.success(res, review);
    } catch (err) {
      if (uploaded) await destroyImage(uploaded.public_id);
      throw err;
    }
  } catch (err) {
    return response.failure(res, 'Failed to update review', 500);
  }
};

const deleteReview = async (req: Request, res: Response) => {
  try {
    const existing = await reviewService.findById(req.params.id);
    if (!existing) return response.failure(res, 'Review not found', 404);
    await reviewService.delete(req.params.id);
    await destroyImage(existing.profilePublicId);
    return response.success(res, { message: 'Review deleted' });
  } catch (err) {
    return response.failure(res, 'Failed to delete review', 500);
  }
};

export const reviewController = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
