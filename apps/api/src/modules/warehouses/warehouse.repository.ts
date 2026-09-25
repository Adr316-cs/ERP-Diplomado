import { WarehouseModel } from "./warehouse.model.js";
import { deactivateCatalogDocument, findCatalogDocument, updateCatalogDocument } from "../../shared/catalog-mutations.js";
import { findCatalogPage, type CatalogQuery } from "../../shared/catalog-query.js";

export const createWarehouse = (input: Record<string, unknown>) => WarehouseModel.create(input);
export const findWarehousesByCompany = (companyId: string, query: CatalogQuery, branchFilter: Record<string, unknown> = {}) =>
  findCatalogPage({ model: WarehouseModel, companyId, query, branchFilter, searchableFields: ["name", "code"], sortableFields: ["name", "code", "createdAt", "updatedAt"] });

export const updateWarehouseInCompany = (companyId: string, id: string, fields: Record<string, unknown>, branchFilter: Record<string, unknown>) => updateCatalogDocument(WarehouseModel, companyId, id, fields, branchFilter);
export const deactivateWarehouseInCompany = (companyId: string, id: string, branchFilter: Record<string, unknown>) => deactivateCatalogDocument(WarehouseModel, companyId, id, branchFilter);


export const findWarehouseInCompany = (companyId: string, id: string, scopeFilter: Record<string, unknown> = {}) => findCatalogDocument(WarehouseModel, companyId, id, scopeFilter);

