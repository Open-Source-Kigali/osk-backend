import { z } from "zod";

export const ORGANISATION_TYPES = [
  "University / School",
  "Tech Company",
  "Government Body",
  "NGO / Community Hub",
  "Other",
] as const;

export const ORGANISATION_SIZES = [
  "1–10 people",
  "11–50 people",
  "51–200 people",
  "201–500 people",
  "500+ people",
] as const;

export const PARTNERSHIP_TIERS = [
  "Gold Partner",
  "Silver Partner",
  "Community Partner",
  "Not Sure Yet",
] as const;

export const APPLICATION_STATUSES = [
  "Pending",
  "Contacted",
  "Approved",
  "Rejected",
] as const;

export const createPartnerApplicationSchema = z.object({
  organisationName: z.string().min(1, "Organisation name is required").trim(),
  organisationType: z.enum(ORGANISATION_TYPES),
  website: z
    .string()
    .min(1, "Website is required")
    .url("Website must be a valid URL")
    .trim(),
  organisationSize: z.enum(ORGANISATION_SIZES),
  country: z.string().min(1, "Country is required").trim(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(300, "Description must be at most 300 characters")
    .trim(),
  partnershipTier: z.enum(PARTNERSHIP_TIERS),
  organisationOffer: z
    .string()
    .min(1, "Organisation offer is required")
    .max(600, "Organisation offer must be at most 600 characters")
    .trim(),
  projectIdea: z.string().trim().optional(),
  fullName: z.string().min(1, "Full name is required").trim(),
  jobTitle: z.string().min(1, "Job title is required").trim(),
  workEmail: z
    .string()
    .min(1, "Work email is required")
    .email("Work email format is invalid")
    .trim(),
  agreedToTerms: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .refine((v) => v === true, "You must agree to the terms"),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

export type CreatePartnerApplicationInput = z.infer<
  typeof createPartnerApplicationSchema
>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
