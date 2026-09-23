import { z } from "zod";

export const ticketSchema = z.object({
  customerId: z.string().trim().min(1).optional(), title: z.string().trim().min(3).max(200), description: z.string().trim().min(3).max(3000),
  category: z.string().trim().min(2).max(80), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"), assignedTo: z.string().trim().min(1).optional()
});
export const commentSchema = z.object({ message: z.string().trim().min(1).max(2000) });