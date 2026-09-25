import { z } from "zod";

export const ticketSchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(), title: z.string().trim().min(3).max(200), description: z.string().trim().min(3).max(3000),
  category: z.string().trim().min(2).max(80), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"), assignedTo: z.string().trim().min(1).optional()
});
export const commentSchema = z.object({ message: z.string().trim().min(1).max(2000) });
export const ticketStatusSchema = z.object({ status: z.enum(["IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED", "CANCELLED"]) });
export const assignmentSchema = z.object({ assignedTo: z.string().trim().min(1).nullable() });
export const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  storageKey: z.string().trim().min(1).max(500),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().min(1).max(25_000_000)
});
export const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const slaPolicySchema = z.object({ priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]), targetMinutes: z.number().int().min(1).max(525_600) });
