import { z } from "zod";

export const opportunitySchema = z.object({
  customerId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(160),
  value: z.number().finite().nonnegative(),
  stage: z.enum(["LEAD", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).default("LEAD"),
  expectedCloseDate: z.coerce.date().optional(),
  assignedTo: z.string().trim().min(1)
});

export const activitySchema = z.object({
  customerId: z.string().trim().min(1),
  opportunityId: z.string().trim().min(1).optional(),
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE"]),
  notes: z.string().trim().min(1).max(1000),
  occurredAt: z.coerce.date()
});