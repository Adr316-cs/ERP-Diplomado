import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { createCategory, findCategoriesByCompany, findCategoryInCompany } from "./category.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

export const registerCategory = async (userId: string, companyId: string, input: { name: string; code: string; parentCategoryId?: string | undefined }) => {
  databaseRequired();
  if (input.parentCategoryId) {
    if (!Types.ObjectId.isValid(input.parentCategoryId)) throw new HttpError(400, "INVALID_CATEGORY_ID", "Categoría padre inválida");
    if (!await findCategoryInCompany(input.parentCategoryId, companyId)) throw new HttpError(400, "CATEGORY_COMPANY_MISMATCH", "La categoría padre no pertenece a la empresa");
  }
  return createCategory({ ...input, companyId, createdBy: userId });
};

export const listCategories = async (companyId: string) => {
  databaseRequired();
  return findCategoriesByCompany(companyId);
};