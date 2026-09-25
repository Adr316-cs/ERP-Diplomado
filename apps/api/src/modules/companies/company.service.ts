import { getDatabaseStatus } from "../../database/mongoose.js";
import { Types } from "mongoose";
import { HttpError } from "../../middleware/errors.js";
import { findCompanyMembership, findUserCompanies, addMembership, createCompanyMembership, incrementTokenVersion, listCompanyUsersFromStore, replaceCompanyRoles } from "../auth/auth.repository.js";
import { UserModel } from "../auth/auth.model.js";
import { companyRoleNames } from "../auth/authorization.js";
import { BranchModel } from "../branches/branch.model.js";
import type { CompanyMembership } from "../auth/auth.types.js";
import { createBranch, createCompany, findBranchesForCompany, findCompaniesForUser } from "./company.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

const membershipFor = async (userId: string, companyId: string) => {
  const membership = await findCompanyMembership(userId, companyId);
  if (!membership) throw new HttpError(403, "COMPANY_ACCESS_DENIED", "No tienes acceso a esta empresa");
  return { companyId: membership.companyId.toString(), branchIds: membership.branchIds.map((id) => id.toString()), isOwner: membership.isOwner } satisfies CompanyMembership;
};
export const registerCompany = async (userId: string, input: { name: string; taxId?: string | undefined }) => {
  databaseRequired();
  const company = await createCompany({ ...input, createdBy: userId });
  await addMembership(userId, company._id.toString(), true);
  await replaceCompanyRoles(userId, company._id.toString(), ["ADMIN"], userId);
  return company;
};

export const listCompanies = async (userId: string) => {
  databaseRequired();
  const memberships = await findUserCompanies(userId);
  return findCompaniesForUser(memberships.map((item) => item.companyId.toString()));
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
  const membership = await membershipFor(userId, companyId);
  return findBranchesForCompany(companyId, membership.isOwner ? undefined : membership.branchIds);
};
export const listCompanyMembers = async (companyId: string) => {
  databaseRequired();
  return listCompanyUsersFromStore(companyId);
};

export const addCompanyMember = async (actorId: string, companyId: string, userId: string, input: { branchIds: string[]; roleNames: string[] }) => {
  databaseRequired();
  if (!Types.ObjectId.isValid(userId)) throw new HttpError(400, "INVALID_USER_ID", "Identificador de usuario inválido");
  if (!await UserModel.exists({ _id: userId, isActive: true })) throw new HttpError(404, "USER_NOT_FOUND", "Usuario no encontrado o inactivo");
  const allowedRoles = new Set<string>(companyRoleNames);
  if (input.roleNames.some((roleName) => !allowedRoles.has(roleName))) throw new HttpError(400, "INVALID_ROLE", "Uno o más roles no son válidos");
  for (const branchId of input.branchIds) {
    if (!Types.ObjectId.isValid(branchId) || !await BranchModel.exists({ _id: branchId, companyId, isActive: true })) {
      throw new HttpError(400, "INVALID_BRANCH_MEMBERSHIP", "Una sucursal no pertenece a esta empresa");
    }
  }
  try {
    await createCompanyMembership({ userId, companyId, branchIds: input.branchIds, roleNames: input.roleNames, assignedBy: actorId });
  } catch (error) {
    if (error instanceof Error && error.message.includes("pertenece a la empresa")) throw new HttpError(409, "USER_ALREADY_IN_COMPANY", error.message);
    throw error;
  }
  return (await listCompanyUsersFromStore(companyId)).find((member) => member.id === userId);
};

export const updateCompanyMemberRoles = async (actorId: string, companyId: string, userId: string, roleNames: string[]) => {
  databaseRequired();
  if (!Types.ObjectId.isValid(userId)) throw new HttpError(400, "INVALID_USER_ID", "Identificador de usuario inválido");
  await membershipFor(userId, companyId);
  const allowedRoles = new Set<string>(companyRoleNames);
  if (roleNames.some((roleName) => !allowedRoles.has(roleName))) throw new HttpError(400, "INVALID_ROLE", "Uno o más roles no son válidos");
  await replaceCompanyRoles(userId, companyId, roleNames, actorId);
  await incrementTokenVersion(userId);
  return (await listCompanyUsersFromStore(companyId)).find((member) => member.id === userId);
};



