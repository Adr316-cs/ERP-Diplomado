import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { findCategoryInCompany } from "../categories/category.repository.js";
import { createProduct, findProductsByCompany } from "./product.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

export const registerProduct = async (userId: string, companyId: string, input: { categoryId: string; branchId?: string | undefined; sku: string; name: string; description?: string | undefined; unitPrice: number; stockMinimum: number }) => {
  databaseRequired();
  if (!Types.ObjectId.isValid(input.categoryId) || !await findCategoryInCompany(input.categoryId, companyId)) {
    throw new HttpError(400, "CATEGORY_COMPANY_MISMATCH", "La categoría no pertenece a la empresa");
  }
  if (input.branchId) {
    if (!Types.ObjectId.isValid(input.branchId) || !await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) {
      throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
    }
  }
  return createProduct({ ...input, companyId, createdBy: userId });
};

export const listProducts = async (companyId: string) => {
  databaseRequired();
  return findProductsByCompany(companyId);
};