import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(160),
  taxId: z.string().trim().min(2).max(50).optional()
});

export const branchSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  address: z.string().trim().max(300).optional()
});