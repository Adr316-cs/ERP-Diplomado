import { z } from "zod";

const code = z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/);
export const brandSchema = z.object({ name: z.string().trim().min(2).max(120), code, description: z.string().trim().max(300).optional() });
export const brandUpdateSchema = brandSchema.partial().refine((value) => Object.keys(value).length > 0);
export const unitSchema = z.object({ name: z.string().trim().min(1).max(80), symbol: z.string().trim().min(1).max(12), decimalPlaces: z.number().int().min(0).max(6).default(0) });
export const unitUpdateSchema = unitSchema.partial().refine((value) => Object.keys(value).length > 0);
export const taxSchema = z.object({ name: z.string().trim().min(2).max(100), code, rate: z.number().finite().min(0).max(100), isInclusive: z.boolean().default(false) });
export const taxUpdateSchema = taxSchema.partial().refine((value) => Object.keys(value).length > 0);
export const paymentMethodSchema = z.object({ name: z.string().trim().min(2).max(100), code, kind: z.enum(["CASH", "CARD", "BANK_TRANSFER", "CHECK", "OTHER"]) });
export const paymentMethodUpdateSchema = paymentMethodSchema.partial().refine((value) => Object.keys(value).length > 0);
