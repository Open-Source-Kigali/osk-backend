import { z } from "zod";

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
  codingLevel: z.enum(["beginner", "intermediate", "advanced"] as const),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  codingLevel: z
    .enum(["beginner", "intermediate", "advanced"] as const)
    .optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
