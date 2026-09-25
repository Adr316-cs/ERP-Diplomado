import { z } from "zod";

export const projectSchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(160), description: z.string().trim().max(1000).optional(),
  managerId: z.string().trim().min(1), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional()
}).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, { message: "endDate debe ser posterior a startDate", path: ["endDate"] });

export const taskSchema = z.object({
  projectId: z.string().trim().min(1), title: z.string().trim().min(2).max(200), description: z.string().trim().max(1000).optional(),
  assignedTo: z.string().trim().min(1), dueDate: z.coerce.date().optional(), hours: z.number().finite().nonnegative().default(0)
});

export const memberSchema = z.object({ userId: z.string().trim().min(1), role: z.enum(["MANAGER", "MEMBER"]).default("MEMBER") });
export const milestoneSchema = z.object({ name: z.string().trim().min(2).max(160), description: z.string().trim().max(1000).optional(), dueDate: z.coerce.date() });
export const timeEntrySchema = z.object({ taskId: z.string().trim().min(1).optional(), workDate: z.coerce.date(), minutes: z.number().int().min(1).max(1440), description: z.string().trim().min(2).max(500) });
export const expenseSchema = z.object({ description: z.string().trim().min(2).max(300), amount: z.number().finite().positive(), currency: z.string().trim().length(3).toUpperCase().default("USD"), spentAt: z.coerce.date() });
