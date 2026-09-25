import { CustomerModel } from "./customer.model.js";
import { findCatalogPage, type CatalogQuery } from "../../shared/catalog-query.js";
import { deactivateCatalogDocument, findCatalogDocument, updateCatalogDocument } from "../../shared/catalog-mutations.js";

export const createCustomer = (input: Record<string, unknown>) => CustomerModel.create(input);
export const findCustomersByCompany = (companyId: string, query: CatalogQuery, branchFilter: Record<string, unknown> = {}) =>
  findCatalogPage({ model: CustomerModel, companyId, query, branchFilter, searchableFields: ["name", "email", "phone", "taxId"], sortableFields: ["name", "email", "createdAt", "updatedAt"] });
export const updateCustomerInCompany = (companyId: string, id: string, fields: Record<string, unknown>, branchFilter: Record<string, unknown>) => updateCatalogDocument(CustomerModel, companyId, id, fields, branchFilter);
export const deactivateCustomerInCompany = (companyId: string, id: string, branchFilter: Record<string, unknown>) => deactivateCatalogDocument(CustomerModel, companyId, id, branchFilter);

export const findCustomerInCompany = (companyId: string, id: string, scopeFilter: Record<string, unknown> = {}) => findCatalogDocument(CustomerModel, companyId, id, scopeFilter);

