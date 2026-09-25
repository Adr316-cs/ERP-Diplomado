import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().finite().positive(),
  unitCost: z.number().finite().nonnegative()
});

export const purchaseRejectionSchema = z.object({ reason: z.string().trim().min(3).max(500) });

const requestLineSchema = z.object({ productId: z.string().trim().min(1), quantity: z.number().finite().positive() });
export const purchaseRequestSchema = z.object({
  branchId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(500),
  lines: z.array(requestLineSchema).min(1).max(500)
});

export const purchaseQuotationSchema = z.object({
  purchaseRequestId: z.string().trim().min(1),
  supplierId: z.string().trim().min(1),
  validUntil: z.coerce.date().optional(),
  terms: z.string().trim().max(500).optional(),
  lines: z.array(lineSchema).min(1).max(500)
});

