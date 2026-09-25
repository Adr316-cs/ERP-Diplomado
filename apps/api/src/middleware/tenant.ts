import { Types } from "mongoose";
import type { Request, RequestHandler } from "express";
import { HttpError } from "./errors.js";
import type { CompanyMembership } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      companyId?: string;
      branchId?: string;
      branchIds?: string[];
      userId?: string;
      roles?: string[];
      permissions?: string[];
      isCompanyOwner?: boolean;
    }
  }
}

const selectedBranch = (request: Request): string | undefined => {
  const values = [request.params.branchId, request.header("x-branch-id"), request.query.branchId, request.body?.branchId]
    .filter((value) => value !== undefined);
  if (values.some((value) => typeof value !== "string")) throw new HttpError(400, "INVALID_BRANCH_ID", "Identificador de sucursal inválido");
  const distinct = [...new Set(values as string[])];
  if (distinct.length > 1) throw new HttpError(400, "BRANCH_CONTEXT_MISMATCH", "Los identificadores de sucursal no coinciden");
  return distinct[0];
};

export const requireCompanyContext: RequestHandler = (request, _response, next) => {
  const companyId = request.params.companyId;
  if (Array.isArray(companyId) || !companyId || !Types.ObjectId.isValid(companyId)) {
    next(new HttpError(400, "INVALID_COMPANY_ID", "Identificador de empresa inválido"));
    return;
  }

  const membership = findMembership(request.auth?.memberships ?? [], companyId);
  if (!membership) {
    next(new HttpError(403, "COMPANY_ACCESS_DENIED", "No tienes acceso a esta empresa"));
    return;
  }

  try {
    const branchId = selectedBranch(request);
    if (branchId && !Types.ObjectId.isValid(branchId)) throw new HttpError(400, "INVALID_BRANCH_ID", "Identificador de sucursal inválido");
    if (branchId && !membership.isOwner && !membership.branchIds.includes(branchId)) {
      throw new HttpError(403, "BRANCH_ACCESS_DENIED", "No tienes acceso a esta sucursal");
    }
    request.companyId = companyId;
    if (branchId) request.branchId = branchId; else delete request.branchId;
    request.branchIds = membership.branchIds;
    if (request.auth?.id) request.userId = request.auth.id; else delete request.userId;
    request.roles = membership.roles ?? [];
    request.permissions = membership.permissions ?? [];
    request.isCompanyOwner = membership.isOwner;
    next();
  } catch (error) {
    next(error);
  }
};

export const branchFilterFor = (request: Request): Record<string, unknown> => {
  if (request.branchId) return { branchId: new Types.ObjectId(request.branchId) };
  if (request.isCompanyOwner) return {};
  const allowed = (request.branchIds ?? []).map((branchId) => new Types.ObjectId(branchId));
  return { $or: [{ branchId: { $in: allowed } }, { branchId: { $exists: false } }] };
};

export const requireCompanyOwner: RequestHandler = (request, _response, next) => {
  const membership = findMembership(request.auth?.memberships ?? [], request.companyId);
  if (!membership?.isOwner) {
    next(new HttpError(403, "COMPANY_OWNER_REQUIRED", "Solo el propietario puede realizar esta operación"));
    return;
  }
  next();
};

export const findMembership = (memberships: CompanyMembership[], companyId: string | undefined) =>
  companyId ? memberships.find((item) => item.companyId === companyId) : undefined;


