import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
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

export const listSuppliers = async (companyId: string) => {
  databaseRequired();
  return findSuppliersByCompany(companyId);
};