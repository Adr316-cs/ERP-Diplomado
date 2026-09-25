import { SupplierModel } from "./supplier.model.js";
import { findCatalogPage, type CatalogQuery } from "../../shared/catalog-query.js";
import { deactivateCatalogDocument, findCatalogDocument, updateCatalogDocument } from "../../shared/catalog-mutations.js";

export const createSupplier = (input: Record<string, unknown>) => SupplierModel.create(input);
export const findSuppliersByCompany = (companyId: string, query: CatalogQuery, branchFilter: Record<string, unknown> = {}) =>
  findCatalogPage({ model: SupplierModel, companyId, query, branchFilter, searchableFields: ["name", "email", "phone", "taxId"], sortableFields: ["name", "email", "createdAt", "updatedAt"] });
export const updateSupplierInCompany = (companyId: string, id: string, fields: Record<string, unknown>, branchFilter: Record<string, unknown>) => updateCatalogDocument(SupplierModel, companyId, id, fields, branchFilter);
export const deactivateSupplierInCompany = (companyId: string, id: string, branchFilter: Record<string, unknown>) => deactivateCatalogDocument(SupplierModel, companyId, id, branchFilter);

export const findSupplierInCompany = (companyId: string, id: string, scopeFilter: Record<string, unknown> = {}) => findCatalogDocument(SupplierModel, companyId, id, scopeFilter);

