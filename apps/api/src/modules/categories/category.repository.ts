import { Types } from "mongoose";
import { CategoryModel } from "./category.model.js";
import { deactivateCatalogDocument, findCatalogDocument, updateCatalogDocument } from "../../shared/catalog-mutations.js";
import { findCatalogPage, type CatalogQuery } from "../../shared/catalog-query.js";

export const createCategory = (input: Record<string, unknown>) => CategoryModel.create(input);
export const findCategoriesByCompany = (companyId: string, query: CatalogQuery) =>
  findCatalogPage({ model: CategoryModel, companyId, query, searchableFields: ["name", "code"], sortableFields: ["name", "code", "createdAt", "updatedAt"] });
export const findCategoryInCompany = (categoryId: string, companyId: string) =>
  CategoryModel.findOne({ _id: new Types.ObjectId(categoryId), companyId: new Types.ObjectId(companyId), isActive: true });

export const updateCategoryInCompany = (companyId: string, id: string, fields: Record<string, unknown>) => updateCatalogDocument(CategoryModel, companyId, id, fields);
export const deactivateCategoryInCompany = (companyId: string, id: string) => deactivateCatalogDocument(CategoryModel, companyId, id);


export const findCategoryByIdInCompany = (companyId: string, id: string) => findCatalogDocument(CategoryModel, companyId, id);

