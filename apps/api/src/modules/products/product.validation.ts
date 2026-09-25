import { z } from "zod";

const productFields = z.object({
  categoryId: z.string().trim().min(1),
  branchId: z.string().trim().min(1).optional(),
  brandId: z.string().trim().min(1).optional(),
  unitId: z.string().trim().min(1).optional(),
  taxId: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).max(60).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional(),
  cost: z.number().finite().nonnegative().default(0),
  unitPrice: z.number().finite().nonnegative().optional(),
  salePrice: z.number().finite().nonnegative().optional(),
  stockMinimum: z.number().int().nonnegative().default(0)
});

export const productSchema = productFields.superRefine((value, context) => {
  if (value.unitPrice === undefined && value.salePrice === undefined) context.addIssue({ code: "custom", path: ["salePrice"], message: "El precio de venta es obligatorio" });
  if (value.unitPrice !== undefined && value.salePrice !== undefined && value.unitPrice !== value.salePrice) context.addIssue({ code: "custom", path: ["unitPrice"], message: "unitPrice y salePrice deben coincidir mientras ventas use unitPrice" });
}).transform((value) => {
  const salePrice = value.salePrice ?? value.unitPrice!;
  return { ...value, unitPrice: salePrice, salePrice };
});

export const productUpdateSchema = productFields.partial().refine((value) => Object.keys(value).length > 0).superRefine((value, context) => {
  if (value.unitPrice !== undefined && value.salePrice !== undefined && value.unitPrice !== value.salePrice) context.addIssue({ code: "custom", path: ["unitPrice"], message: "unitPrice y salePrice deben coincidir mientras ventas use unitPrice" });
});
