import { Types } from "mongoose";
import { WarehouseModel } from "./warehouse.model.js";

export const createWarehouse = (input: Record<string, unknown>) => WarehouseModel.create(input);

export const findWarehousesByCompany = (companyId: string) =>
  WarehouseModel.find({ companyId: new Types.ObjectId(companyId), isActive: true }).sort({ name: 1 });