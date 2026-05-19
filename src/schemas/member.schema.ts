import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email must be a valid email address"),
  githubUsername: z.string().min(1, "GitHub username is required"),
  orgName: z.string().min(1, "Organization name is required"),
  joinReason: z.string().min(1, "Join reason is required"),
  codingLevel: z
    .enum(["beginner", "intermediate", "advanced"])
    .refine((val) => val, { message: "Coding level is required" }),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email("Email must be a valid email address").optional(),
  githubUsername: z.string().min(1).optional(),
  orgName: z.string().min(1).optional(),
  joinReason: z.string().min(1).optional(),
  codingLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
