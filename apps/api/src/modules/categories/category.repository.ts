import { Types } from "mongoose";
import { CategoryModel } from "./category.model.js";

export const createCategory = (input: Record<string, unknown>) => CategoryModel.create(input);

export const findCategoriesByCompany = (companyId: string) =>
  CategoryModel.find({ companyId: new Types.ObjectId(companyId), isActive: true }).sort({ name: 1 });

export const findCategoryInCompany = (categoryId: string, companyId: string) =>
  CategoryModel.findOne({ _id: categoryId, companyId, isActive: true });