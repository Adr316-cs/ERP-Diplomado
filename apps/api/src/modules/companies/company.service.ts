import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { findUserById, addMembership } from "../auth/auth.repository.js";
import type { CompanyMembership } from "../auth/auth.types.js";
import { createBranch, createCompany, findBranchesForCompany, findCompaniesForUser } from "./company.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

const membershipFor = async (userId: string, companyId: string) => {
  const user = await findUserById(userId);
  const memberships = (user?.memberships ?? []) as unknown as CompanyMembership[];
  const membership = memberships.find((item) => item.companyId === companyId);
  if (!membership) throw new HttpError(403, "COMPANY_ACCESS_DENIED", "No tienes acceso a esta empresa");
  return membership;
};

export const registerCompany = async (userId: string, input: { name: string; taxId?: string | undefined }) => {
  databaseRequired();
  const company = await createCompany({ ...input, createdBy: userId });
  await addMembership(userId, company._id.toString(), true);
  return company;
};

export const listCompanies = async (userId: string) => {
  databaseRequired();
  const user = await findUserById(userId);
  const memberships = (user?.memberships ?? []) as unknown as CompanyMembership[];
  return findCompaniesForUser(memberships.map((item) => item.companyId));
};

export const registerBranch = async (userId: string, companyId: string, input: { name: string; code: string; address?: string | undefined }) => {
  databaseRequired();
  const membership = await membershipFor(userId, companyId);
  if (!membership.isOwner) throw new HttpError(403, "COMPANY_OWNER_REQUIRED", "Solo el propietario puede crear sucursales");
  const branch = await createBranch({ ...input, companyId, createdBy: userId });
  await addMembership(userId, companyId, true, branch._id.toString());
  return branch;
};

export const listBranches = async (userId: string, companyId: string) => {
  databaseRequired();
  await membershipFor(userId, companyId);
  return findBranchesForCompany(companyId);
};