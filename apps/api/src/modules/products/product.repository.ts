import { ProductModel } from "./product.model.js";
import { findCatalogPage, type CatalogQuery } from "../../shared/catalog-query.js";
import { deactivateCatalogDocument, findCatalogDocument, updateCatalogDocument } from "../../shared/catalog-mutations.js";

export const createProduct = (input: Record<string, unknown>) => ProductModel.create(input);
export const findProductsByCompany = (companyId: string, query: CatalogQuery, branchFilter: Record<string, unknown> = {}) =>
  findCatalogPage({ model: ProductModel, companyId, query, branchFilter, searchableFields: ["name", "sku", "description"], sortableFields: ["name", "sku", "unitPrice", "createdAt", "updatedAt"] });

export const updateProductInCompany = (companyId: string, id: string, fields: Record<string, unknown>, branchFilter: Record<string, unknown>) => updateCatalogDocument(ProductModel, companyId, id, fields, branchFilter);
export const deactivateProductInCompany = (companyId: string, id: string, branchFilter: Record<string, unknown>) => deactivateCatalogDocument(ProductModel, companyId, id, branchFilter);


export const findProductInCompany = (companyId: string, id: string, scopeFilter: Record<string, unknown> = {}) => findCatalogDocument(ProductModel, companyId, id, scopeFilter);

