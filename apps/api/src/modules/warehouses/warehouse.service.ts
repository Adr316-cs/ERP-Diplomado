import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { createWarehouse, findWarehousesByCompany } from "./warehouse.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

export const registerWarehouse = async (userId: string, companyId: string, input: { branchId: string; name: string; code: string }) => {
  databaseRequired();
  if (!Types.ObjectId.isValid(input.branchId) || !await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) {
    throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  }
  return createWarehouse({ ...input, companyId, createdBy: userId });
};

export const listWarehouses = async (companyId: string) => {
  databaseRequired();
  return findWarehousesByCompany(companyId);
};