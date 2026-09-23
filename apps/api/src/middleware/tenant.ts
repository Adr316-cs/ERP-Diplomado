import { Types } from "mongoose";
import type { RequestHandler } from "express";
import { HttpError } from "./errors.js";
import type { CompanyMembership } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      companyId?: string;
      branchId?: string;
    }
  }
}

export const requireCompanyContext: RequestHandler = (request, _response, next) => {
  const companyId = request.params.companyId;
  if (Array.isArray(companyId)) {
    next(new HttpError(400, "INVALID_COMPANY_ID", "Identificador de empresa inválido"));
    return;
  }
  if (!companyId || !Types.ObjectId.isValid(companyId)) {
    next(new HttpError(400, "INVALID_COMPANY_ID", "Identificador de empresa inválido"));
    return;
  }

  const membership = findMembership(request.auth?.memberships ?? [], companyId);
  if (!membership) {
    next(new HttpError(403, "COMPANY_ACCESS_DENIED", "No tienes acceso a esta empresa"));
    return;
  }

  request.companyId = companyId;
  next();
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