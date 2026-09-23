import { z } from "zod";

export const movementSchema = z.object({
  productId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  destinationWarehouseId: z.string().trim().min(1).optional(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER"]),
  quantity: z.number().finite().positive(),
  reason: z.string().trim().min(3).max(300)
});