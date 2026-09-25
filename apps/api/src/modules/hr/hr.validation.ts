import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9_-]+$/)
});

export const positionSchema = z.object({
  departmentId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9_-]+$/),
  description: z.string().trim().max(500).optional()
});

export const employeeSchema = z.object({
  branchId: z.string().trim().min(1).optional(),
  departmentId: z.string().trim().min(1),
  positionId: z.string().trim().min(1).optional(),
  userId: z.string().trim().min(1),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  position: z.string().trim().min(2).max(120),
  hireDate: z.coerce.date(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).default("ACTIVE")
});

export const contractSchema = z.object({
  employeeId: z.string().trim().min(1),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  salary: z.number().finite().nonnegative(),
  currency: z.string().trim().length(3).toUpperCase().default("USD")
}).refine((value) => !value.endDate || value.endDate >= value.startDate, {
  message: "endDate debe ser mayor o igual a startDate",
  path: ["endDate"]
});

export const attendanceSchema = z.object({
  employeeId: z.string().trim().min(1),
  date: z.coerce.date(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]).default("PRESENT")
}).refine((value) => !value.checkIn || !value.checkOut || value.checkOut >= value.checkIn, {
  message: "checkOut debe ser posterior a checkIn",
  path: ["checkOut"]
});

export const leaveSchema = z.object({
  employeeId: z.string().trim().min(1),
  type: z.enum(["VACATION", "SICK", "PERSONAL", "MATERNITY", "UNPAID"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().trim().max(300).optional()
}).refine((value) => value.endDate >= value.startDate, {
  message: "endDate debe ser mayor o igual a startDate",
  path: ["endDate"]
});

export const leaveStatusSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });
export const employeeDocumentSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.enum(["IDENTITY", "CONTRACT", "CERTIFICATE", "OTHER"]),
  storageKey: z.string().trim().min(1).max(500),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().min(1).max(25_000_000),
  expiresAt: z.coerce.date().optional()
});
