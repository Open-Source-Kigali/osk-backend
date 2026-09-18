import { z } from "zod";

export const createReviewSchema = z.object({
  name: z.string().min(1, "name is required and cannot be empty").trim(),
  role: z.string().min(1, "Role is required and cannot be empty").trim(),
  message: z.string().min(1, "message is required and cannot be empty").trim(),
});

export const updateReviewSchema = createReviewSchema.partial();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
