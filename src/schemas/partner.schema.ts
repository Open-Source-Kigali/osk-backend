import { z } from "zod";

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .url("Website URL must be a valid URL")
    .trim(),
  description: z.string().min(1, "Description is required").trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Email format is invalid")
    .trim(),
  partnershipReason: z.string().min(1, "Partnership reason is required").trim(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
