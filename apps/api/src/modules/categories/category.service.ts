import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { createCategory, findCategoriesByCompany, findCategoryInCompany, updateCategoryInCompany, deactivateCategoryInCompany, findCategoryByIdInCompany } from "./category.repository.js";
import { ProductModel } from "../products/product.model.js";
import { CategoryModel } from "./category.model.js";
import { validateCatalogId } from "../../shared/catalog-mutations.js";
import { categoryParentWouldCycle } from "../../shared/category-tree.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

const validateParentCategory = async (companyId: string, parentCategoryId: string, categoryId?: string) => {
  if (!Types.ObjectId.isValid(parentCategoryId)) throw new HttpError(400, "INVALID_CATEGORY_ID", "Categoría padre inválida");
  let current = await findCategoryInCompany(parentCategoryId, companyId);
  if (!current) throw new HttpError(400, "CATEGORY_COMPANY_MISMATCH", "La categoría padre no pertenece a la empresa");
  const visited = new Set<string>();
  for (let depth = 0; current && depth < 100; depth += 1) {
    const currentId = current._id.toString();
    if (categoryParentWouldCycle(categoryId ?? "", [...visited, currentId])) throw new HttpError(409, "CATEGORY_CYCLE", "La jerarquía de categorías no puede contener ciclos");
    visited.add(currentId);
    const ancestorId: string | undefined = current.parentCategoryId?.toString();
    current = ancestorId ? await findCategoryInCompany(ancestorId, companyId) : null;
  }
  if (current) throw new HttpError(409, "CATEGORY_DEPTH_LIMIT", "La jerarquía supera el límite de profundidad permitido");
};
export const registerCategory = async (userId: string, companyId: string, input: { name: string; code: string; parentCategoryId?: string | undefined }) => {
  databaseRequired();
  if (input.parentCategoryId) {
    if (!Types.ObjectId.isValid(input.parentCategoryId)) throw new HttpError(400, "INVALID_CATEGORY_ID", "CategorÃ­a padre invÃ¡lida");
    if (!await findCategoryInCompany(input.parentCategoryId, companyId)) throw new HttpError(400, "CATEGORY_COMPANY_MISMATCH", "La categorÃ­a padre no pertenece a la empresa");
  }
  return createCategory({ ...input, companyId, createdBy: userId });
};

export const listCategories = async (companyId: string, query: import("../../shared/catalog-query.js").CatalogQuery) => {
  databaseRequired();
  return findCategoriesByCompany(companyId, query);
};

export const updateCategory = async (companyId: string, id: string, input: { name?: string | undefined; code?: string | undefined; parentCategoryId?: string | undefined }) => {
  databaseRequired();
  validateCatalogId(id);
  if (input.parentCategoryId) await validateParentCategory(companyId, input.parentCategoryId, id);
  const category = await updateCategoryInCompany(companyId, id, input);
  if (!category) throw new HttpError(404, "CATEGORY_NOT_FOUND", "Categoría no encontrada");
  return category;
};

export const deactivateCategory = async (companyId: string, id: string) => {
  databaseRequired();
  validateCatalogId(id);
  const [hasProducts, hasChildren] = await Promise.all([
    ProductModel.exists({ companyId, categoryId: id, isActive: true }),
    CategoryModel.exists({ companyId, parentCategoryId: id, isActive: true })
  ]);
  if (hasProducts || hasChildren) throw new HttpError(409, "CATEGORY_IN_USE", "No se puede dar de baja una categoría con productos o subcategorías activas");
  const category = await deactivateCategoryInCompany(companyId, id);
  if (!category) throw new HttpError(404, "CATEGORY_NOT_FOUND", "Categoría no encontrada");
  return category;
};

export const getCategory = async (companyId: string, id: string) => {
  databaseRequired();
  validateCatalogId(id);
  const category = await findCategoryByIdInCompany(companyId, id);
  if (!category) throw new HttpError(404, "CATEGORY_NOT_FOUND", "Categoría no encontrada");
  return category;
};




