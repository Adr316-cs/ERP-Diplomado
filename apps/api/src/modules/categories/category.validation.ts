import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  parentCategoryId: z.string().trim().min(1).optional()
});
export const categoryUpdateSchema = categorySchema.partial().refine((value) => Object.keys(value).length > 0);

