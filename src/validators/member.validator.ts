import { z } from "zod";

export const memberCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  githubUsername: z.string().min(1),
  orgName: z.string().min(1),
  joinReason: z.string().min(1),
  codingLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

export const memberUpdateSchema = memberCreateSchema.partial();
