import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { BrandModel, TaxModel, UnitModel } from "../master-data/master-data.model.js";
import { validateCatalogId } from "../../shared/catalog-mutations.js";
import { findCategoryInCompany } from "../categories/category.repository.js";
import { createProduct, findProductsByCompany, findProductInCompany, updateProductInCompany, deactivateProductInCompany } from "./product.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

export const registerProduct = async (userId: string, companyId: string, input: { categoryId: string; branchId?: string | undefined; brandId?: string | undefined; unitId?: string | undefined; taxId?: string | undefined; sku: string; name: string; description?: string | undefined; cost: number; unitPrice: number; salePrice: number; stockMinimum: number }) => {
  databaseRequired();
  if (!Types.ObjectId.isValid(input.categoryId) || !await findCategoryInCompany(input.categoryId, companyId)) {
    throw new HttpError(400, "CATEGORY_COMPANY_MISMATCH", "La categorÃ­a no pertenece a la empresa");
  }
  for (const referenceId of [input.brandId, input.unitId, input.taxId]) if (referenceId && !Types.ObjectId.isValid(referenceId)) throw new HttpError(400, "INVALID_MASTER_DATA_ID", "Identificador de catálogo maestro inválido");
  const masterReferences = await Promise.all([
    input.brandId ? BrandModel.exists({ _id: input.brandId, companyId, isActive: true }) : true,
    input.unitId ? UnitModel.exists({ _id: input.unitId, companyId, isActive: true }) : true,
    input.taxId ? TaxModel.exists({ _id: input.taxId, companyId, isActive: true }) : true
  ]);
  if (masterReferences.some((result) => !result)) throw new HttpError(400, "MASTER_DATA_COMPANY_MISMATCH", "Marca, unidad o impuesto no pertenece a la empresa");
  if (input.branchId) {
    if (!Types.ObjectId.isValid(input.branchId) || !await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) {
      throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
    }
  }
  return createProduct({ ...input, companyId, createdBy: userId });
};

export const listProducts = async (companyId: string, query: import("../../shared/catalog-query.js").CatalogQuery, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  return findProductsByCompany(companyId, query, branchFilter);
};


export const updateProduct = async (companyId: string, id: string, input: { categoryId?: string | undefined; branchId?: string | undefined; brandId?: string | undefined; unitId?: string | undefined; taxId?: string | undefined; sku?: string | undefined; name?: string | undefined; description?: string | undefined; cost?: number | undefined; unitPrice?: number | undefined; salePrice?: number | undefined; stockMinimum?: number | undefined }, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  if (input.categoryId && (!Types.ObjectId.isValid(input.categoryId) || !await findCategoryInCompany(input.categoryId, companyId))) {
    throw new HttpError(400, "CATEGORY_COMPANY_MISMATCH", "La categoría no pertenece a la empresa");
  }
  for (const referenceId of [input.brandId, input.unitId, input.taxId]) if (referenceId && !Types.ObjectId.isValid(referenceId)) throw new HttpError(400, "INVALID_MASTER_DATA_ID", "Identificador de catálogo maestro inválido");
  const masterReferences = await Promise.all([
    input.brandId ? BrandModel.exists({ _id: input.brandId, companyId, isActive: true }) : true,
    input.unitId ? UnitModel.exists({ _id: input.unitId, companyId, isActive: true }) : true,
    input.taxId ? TaxModel.exists({ _id: input.taxId, companyId, isActive: true }) : true
  ]);
  if (masterReferences.some((result) => !result)) throw new HttpError(400, "MASTER_DATA_COMPANY_MISMATCH", "Marca, unidad o impuesto no pertenece a la empresa");
  if (input.branchId) {
    if (!Types.ObjectId.isValid(input.branchId) || !await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) {
      throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
    }
  }
  const price = input.salePrice ?? input.unitPrice;
  const fields = price === undefined ? input : { ...input, salePrice: price, unitPrice: price };
  const product = await updateProductInCompany(companyId, id, fields, branchFilter);
  if (!product) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  return product;
};

export const deactivateProduct = async (companyId: string, id: string, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  if (await InventoryModel.exists({ companyId, productId: id, quantity: { $gt: 0 } })) {
    throw new HttpError(409, "PRODUCT_HAS_STOCK", "No se puede dar de baja un producto con existencias");
  }
  const product = await deactivateProductInCompany(companyId, id, branchFilter);
  if (!product) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  return product;
};




export const getProduct = async (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  validateCatalogId(id);
  const record = findProductInCompany(companyId, id, branchFilter);
  const found = await record;
  if (!found) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado");
  return found;
};
