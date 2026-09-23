import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  taxId: z.string().trim().max(50).optional(),
  branchId: z.string().trim().min(1).optional()
});