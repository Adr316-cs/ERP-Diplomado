import { Types } from "mongoose";
import { SupplierModel } from "./supplier.model.js";

export const createSupplier = (input: Record<string, unknown>) => SupplierModel.create(input);

export const findSuppliersByCompany = (companyId: string) =>
  SupplierModel.find({ companyId: new Types.ObjectId(companyId), isActive: true }).sort({ name: 1 });