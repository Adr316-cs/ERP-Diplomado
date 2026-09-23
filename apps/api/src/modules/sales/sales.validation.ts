import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().finite().positive(),
  unitPrice: z.number().finite().nonnegative().optional()
});

export const quoteSchema = z.object({
  branchId: z.string().trim().min(1),
  customerId: z.string().trim().min(1),
  lines: z.array(lineSchema).min(1).max(500)
});

export const orderSchema = z.object({
  branchId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  customerId: z.string().trim().min(1),
  quoteId: z.string().trim().min(1).optional(),
  lines: z.array(lineSchema).min(1).max(500)
});