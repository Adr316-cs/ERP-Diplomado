import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().finite().positive(),
  unitCost: z.number().finite().nonnegative()
});

export const purchaseOrderSchema = z.object({
  branchId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  supplierId: z.string().trim().min(1),
  lines: z.array(lineSchema).min(1).max(500)
});