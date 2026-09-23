import { z } from "zod";

export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  branchId: z.string().trim().min(1).optional()
}).refine((value) => !value.from || !value.to || value.to >= value.from, {
  message: "to debe ser posterior a from",
  path: ["to"]
});