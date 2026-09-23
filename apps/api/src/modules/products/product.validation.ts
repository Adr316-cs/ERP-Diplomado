import { z } from "zod";

export const productSchema = z.object({
  categoryId: z.string().trim().min(1),
  branchId: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).max(60).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional(),
  unitPrice: z.number().finite().nonnegative(),
  stockMinimum: z.number().int().nonnegative().default(0)
});