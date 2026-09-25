import { z } from "zod";

export const warehouseSchema = z.object({
  branchId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/)
});
export const warehouseUpdateSchema = warehouseSchema.partial().refine((value) => Object.keys(value).length > 0);

