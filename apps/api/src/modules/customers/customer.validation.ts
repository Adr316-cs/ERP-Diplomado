import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  taxId: z.string().trim().max(50).optional(),
  branchId: z.string().trim().min(1).optional()
});
export const customerUpdateSchema = customerSchema.partial().refine((value) => Object.keys(value).length > 0);

