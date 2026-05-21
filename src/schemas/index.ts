import { z } from 'zod';

// ── Members ──────────────────────────────────────────────────────────────────

export const createMemberSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('email must be a valid email address'),
  githubUsername: z.string().min(1, 'githubUsername is required'),
  orgName: z.string().min(1, 'orgName is required'),
  joinReason: z.string().min(1, 'joinReason is required'),
  codingLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
    errorMap: () => ({ message: 'codingLevel must be BEGINNER, INTERMEDIATE, or ADVANCED' }),
  }),
});

export const updateMemberSchema = createMemberSchema.partial();

// ── Partners ──────────────────────────────────────────────────────────────────

export const createPartnerSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('email must be a valid email address'),
  websiteUrl: z.string().url('websiteUrl must be a valid URL'),
});

export const updatePartnerSchema = createPartnerSchema.partial();

// ── Events ────────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  date: z.string().datetime({ message: 'date must be a valid ISO 8601 datetime string' }),
  location: z.string().min(1, 'location is required'),
  mode: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID'], {
    errorMap: () => ({ message: 'mode must be ONLINE, IN_PERSON, or HYBRID' }),
  }),
  capacity: z.number().int().nonnegative('capacity must be a non-negative integer'),
  registered: z
    .number()
    .int()
    .nonnegative('registered must be a non-negative integer')
    .optional(),
}).refine(
  (data) => data.registered === undefined || data.registered <= data.capacity,
  { message: 'registered cannot exceed capacity', path: ['registered'] },
);

export const updateEventSchema = createEventSchema.partial().refine(
  (data) =>
    data.registered === undefined ||
    data.capacity === undefined ||
    data.registered <= data.capacity,
  { message: 'registered cannot exceed capacity', path: ['registered'] },
);

// ── Projects ──────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  repoOwner: z.string().min(1, 'repoOwner is required'),
  repoName: z.string().min(1, 'repoName is required'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must contain only lowercase letters, digits, and hyphens'),
});

export const updateProjectSchema = createProjectSchema.partial();

// ── Reviews ───────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  name: z.string().min(1, 'name is required'),
  role: z.string().min(1, 'role is required'),
  message: z.string().min(1, 'message is required'),
});

export const updateReviewSchema = createReviewSchema.partial();
