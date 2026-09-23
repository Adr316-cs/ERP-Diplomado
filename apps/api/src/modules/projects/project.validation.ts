import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(160), description: z.string().trim().max(1000).optional(),
  managerId: z.string().trim().min(1), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional()
}).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, { message: "endDate debe ser posterior a startDate", path: ["endDate"] });

export const taskSchema = z.object({
  projectId: z.string().trim().min(1), title: z.string().trim().min(2).max(200), description: z.string().trim().max(1000).optional(),
  assignedTo: z.string().trim().min(1), dueDate: z.coerce.date().optional(), hours: z.number().finite().nonnegative().default(0)
});