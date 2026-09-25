import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { deactivateSupplierInCompany, findSupplierInCompany, updateSupplierInCompany } from "./supplier.repository.js";
import { validateCatalogId } from "../../shared/catalog-mutations.js";
import { createSupplier, findSuppliersByCompany } from "./supplier.repository.js";

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

export const registerSupplier = async (userId: string, companyId: string, input: { name: string; email?: string | undefined; phone?: string | undefined; taxId?: string | undefined; branchId?: string | undefined }) => {
  databaseRequired();
  await validateBranch(companyId, input.branchId);
  return createSupplier({ ...input, companyId, createdBy: userId });
};

export const listSuppliers = async (companyId: string, query: import("../../shared/catalog-query.js").CatalogQuery, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  return findSuppliersByCompany(companyId, query, branchFilter);
};


export const updateSupplier = async (companyId: string, id: string, input: { name?: string | undefined; email?: string | undefined; phone?: string | undefined; taxId?: string | undefined; branchId?: string | undefined }, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  await validateBranch(companyId, input.branchId);
  const supplier = await updateSupplierInCompany(companyId, id, input, branchFilter);
  if (!supplier) throw new HttpError(404, "SUPPLIER_NOT_FOUND", "Proveedor no encontrado");
  return supplier;
};

export const deactivateSupplier = async (companyId: string, id: string, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  const supplier = await deactivateSupplierInCompany(companyId, id, branchFilter);
  if (!supplier) throw new HttpError(404, "SUPPLIER_NOT_FOUND", "Proveedor no encontrado");
  return supplier;
};


export const getSupplier = async (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  validateCatalogId(id);
  const record = findSupplierInCompany(companyId, id, branchFilter);
  const found = await record;
  if (!found) throw new HttpError(404, "SUPPLIER_NOT_FOUND", "Proveedor no encontrado");
  return found;
};
