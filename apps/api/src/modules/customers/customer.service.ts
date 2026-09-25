import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { deactivateCustomerInCompany, findCustomerInCompany, updateCustomerInCompany } from "./customer.repository.js";
import { validateCatalogId } from "../../shared/catalog-mutations.js";
import { createCustomer, findCustomersByCompany } from "./customer.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

const validateBranch = async (companyId: string, branchId: string | undefined) => {
  if (!branchId) return;
  if (!Types.ObjectId.isValid(branchId)) throw new HttpError(400, "INVALID_BRANCH_ID", "Identificador de sucursal inválido");
  if (!await BranchModel.exists({ _id: branchId, companyId, isActive: true })) {
    throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  }
};

export const registerCustomer = async (userId: string, companyId: string, input: { name: string; email?: string | undefined; phone?: string | undefined; taxId?: string | undefined; branchId?: string | undefined }) => {
  databaseRequired();
  await validateBranch(companyId, input.branchId);
  return createCustomer({ ...input, companyId, createdBy: userId });
};

export const listCustomers = async (companyId: string, query: import("../../shared/catalog-query.js").CatalogQuery, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  return findCustomersByCompany(companyId, query, branchFilter);
};


export const updateCustomer = async (companyId: string, id: string, input: { name?: string | undefined; email?: string | undefined; phone?: string | undefined; taxId?: string | undefined; branchId?: string | undefined }, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  await validateBranch(companyId, input.branchId);
  const customer = await updateCustomerInCompany(companyId, id, input, branchFilter);
  if (!customer) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Cliente no encontrado");
  return customer;
};

export const deactivateCustomer = async (companyId: string, id: string, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  const customer = await deactivateCustomerInCompany(companyId, id, branchFilter);
  if (!customer) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Cliente no encontrado");
  return customer;
};


export const getCustomer = async (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  validateCatalogId(id);
  const record = findCustomerInCompany(companyId, id, branchFilter);
  const found = await record;
  if (!found) throw new HttpError(404, "CUSTOMER_NOT_FOUND", "Cliente no encontrado");
  return found;
};
