import { z } from "zod";

export const leadSchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(160).optional(),
  source: z.string().trim().max(80).optional(),
  assignedTo: z.string().trim().min(1)
});

export const opportunitySchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(),
  leadId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(160),
  value: z.number().finite().nonnegative(),
  expectedCloseDate: z.coerce.date().optional(),
  assignedTo: z.string().trim().min(1)
}).refine((value) => Boolean(value.customerId) !== Boolean(value.leadId), { path: ["leadId"], message: "Indica un cliente o un lead" });

export const opportunityQuoteSchema = z.object({
  lines: z.array(z.object({ productId: z.string().trim().min(1), quantity: z.number().finite().positive() })).min(1).max(500)
});
export const opportunityStageSchema = z.object({ stage: z.enum(["WON", "LOST"]) });

export const contactSchema = z.object({
  customerId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  title: z.string().trim().max(100).optional(),
  isPrimary: z.boolean().default(false)
});

export const activitySchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(),
  leadId: z.string().trim().min(1).optional(),
  opportunityId: z.string().trim().min(1).optional(),
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE"]),
  notes: z.string().trim().min(1).max(1000),
  occurredAt: z.coerce.date()
}).refine((value) => Boolean(value.customerId) !== Boolean(value.leadId), { path: ["leadId"], message: "Indica un cliente o un lead" });

export const interactionSchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(),
  leadId: z.string().trim().min(1).optional(),
  opportunityId: z.string().trim().min(1).optional(),
  type: z.enum(["CALL", "EMAIL", "MEETING", "MESSAGE", "OTHER"]),
  subject: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(1).max(1500),
  occurredAt: z.coerce.date()
}).refine((value) => Boolean(value.customerId) !== Boolean(value.leadId), { path: ["leadId"], message: "Indica un cliente o un lead" });
