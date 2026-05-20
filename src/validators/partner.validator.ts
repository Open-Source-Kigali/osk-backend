import { z } from "zod";

const urlOrUndefined = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;
    return val.trim() === "" ? undefined : val;
  },
  z.string().url().optional(),
);

export const partnerCreateSchema = z.object({
  name: z.string().min(1),
  websiteUrl: urlOrUndefined,
  description: z.string().min(1),
  email: z.string().email(),
  partershipReason: z.string().min(1),
});

export const partnerUpdateSchema = partnerCreateSchema.partial();
