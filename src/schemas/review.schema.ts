import { z } from "zod";

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const MODERATION_DECISIONS = ["APPROVED", "REJECTED"] as const;

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const roleField = z
  .string()
  .trim()
  .min(1, "Role is required")
  .max(200, "Role must be at most 200 characters");

const messageField = z
  .string()
  .trim()
  .min(1, "Message is required")
  .max(2000, "Message must be at most 2000 characters");

export const createReviewSchema = z.object({
  name: nameField,
  role: roleField,
  message: messageField,
});

export const updateReviewSchema = z.object({
  name: nameField.optional(),
  role: roleField.optional(),
  message: messageField.optional(),
});

export const reviewModerationSchema = z.object({
  status: z.enum(MODERATION_DECISIONS),
});

export const reviewListQuerySchema = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;
