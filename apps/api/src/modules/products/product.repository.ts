import { Types } from "mongoose";
import { ProductModel } from "./product.model.js";

export const createProduct = (input: Record<string, unknown>) => ProductModel.create(input);

export const findProductsByCompany = (companyId: string) =>
  ProductModel.find({ companyId: new Types.ObjectId(companyId), isActive: true }).sort({ name: 1 });