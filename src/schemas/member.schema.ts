import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Email format is invalid"),
  githubUsername: z.string().trim().min(1, "GitHub username is required"),
  orgName: z.string().trim().min(1, "Organization name is required"),
  joinReason: z.string().trim().min(1, "Join reason is required"),
  codingLevel: z.enum(["beginner", "intermediate", "advanced"] as const),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  codingLevel: z
    .enum(["beginner", "intermediate", "advanced"] as const)
    .optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
