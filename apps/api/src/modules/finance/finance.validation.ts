import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(["CASH", "BANK", "RECEIVABLE", "PAYABLE", "OTHER"]),
  currency: z.string().trim().length(3).toUpperCase().default("USD")
});

export const transactionSchema = z.object({
  accountId: z.string().trim().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().finite().positive(),
  description: z.string().trim().min(3).max(300),
  saleId: z.string().trim().min(1).optional(),
  purchaseOrderId: z.string().trim().min(1).optional()
}).superRefine((value, context) => {
  if (value.saleId && value.purchaseOrderId) context.addIssue({ code: "custom", path: ["saleId"], message: "Un movimiento solo puede vincularse a una venta o compra" });
  if (value.saleId && value.type !== "INCOME") context.addIssue({ code: "custom", path: ["type"], message: "Una venta debe registrarse como ingreso" });
  if (value.purchaseOrderId && value.type !== "EXPENSE") context.addIssue({ code: "custom", path: ["type"], message: "Una compra debe registrarse como egreso" });
});

export const budgetSchema = z.object({
  code: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["INCOME", "EXPENSE"]),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  amount: z.number().finite().positive()
}).superRefine((value, context) => {
  if (value.periodEnd <= value.periodStart) context.addIssue({ code: "custom", path: ["periodEnd"], message: "El fin del periodo debe ser posterior al inicio" });
});

export const paymentSchema = z.object({
  accountId: z.string().trim().min(1),
  paymentMethodId: z.string().trim().min(1).optional(),
  type: z.enum(["CUSTOMER", "SUPPLIER"]),
  amount: z.number().finite().positive(),
  saleId: z.string().trim().min(1).optional(),
  purchaseOrderId: z.string().trim().min(1).optional(),
  reference: z.string().trim().max(120).optional()
}).superRefine((value, context) => {
  if (value.type === "CUSTOMER" && !value.saleId) context.addIssue({ code: "custom", path: ["saleId"], message: "El pago de cliente requiere saleId" });
  if (value.type === "SUPPLIER" && !value.purchaseOrderId) context.addIssue({ code: "custom", path: ["purchaseOrderId"], message: "El pago a proveedor requiere purchaseOrderId" });
});

