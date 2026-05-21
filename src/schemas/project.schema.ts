import { z } from "zod";

export const createProjectSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only, no spaces or special characters",
    )
    .trim(),
  repoOwner: z
    .string()
    .min(1, "Repository owner is required and cannot be empty")
    .trim(),
  repoName: z
    .string()
    .min(1, "Repository name is required and cannot be empty")
    .trim(),
  tagline: z.string().min(1, "Tagline is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  status: z
    .enum(["active", "archived", "paused"] as const)
    .optional()
    .default("active"),
  featured: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional()
    .default(false),
  maintainer: z.string().trim().optional().nullable(),
  langColor: z.string().trim().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema
  .omit({ status: true, featured: true })
  .partial()
  .extend({
    status: z.enum(["active", "archived", "paused"] as const).optional(),
    featured: z
      .union([z.boolean(), z.string().transform((v) => v === "true")])
      .optional(),
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
