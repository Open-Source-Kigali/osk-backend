import { z } from "zod";

/**
 * Schema for creating a new member.
 * Ensures all required fields are present and email is correctly formatted.
 */
export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Email format is invalid")
    .trim(),
  githubUsername: z.string().min(1, "GitHub username is required").trim(),
  orgName: z.string().min(1, "Organization name is required").trim(),
  joinReason: z.string().min(1, "Join reason is required").trim(),
  // codingLevel must be one of the pre-defined enum values
  codingLevel: z.enum(["beginner", "intermediate", "advanced"] as const),
});

/**
 * Schema for updating an existing member.
 * All fields are optional.
 */
export const updateMemberSchema = createMemberSchema.partial().extend({
  codingLevel: z
    .enum(["beginner", "intermediate", "advanced"] as const)
    .optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
