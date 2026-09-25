import { z } from "zod";
import { companyRoleNames } from "../auth/authorization.js";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(160),
  taxId: z.string().trim().min(2).max(50).optional()
});

export const branchSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  address: z.string().trim().max(300).optional()
});
export const companyMemberSchema = z.object({
  branchIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  roleNames: z.array(z.enum(companyRoleNames)).min(1).refine((roles) => new Set(roles).size === roles.length, "No repitas roles")
});

export const companyMemberRolesSchema = z.object({
  roleNames: z.array(z.enum(companyRoleNames)).refine((roles) => new Set(roles).size === roles.length, "No repitas roles")
});
