import { Types } from "mongoose";
import { CustomerModel } from "./customer.model.js";

export const createCustomer = (input: Record<string, unknown>) => CustomerModel.create(input);

export const findCustomersByCompany = (companyId: string) =>
  CustomerModel.find({ companyId: new Types.ObjectId(companyId), isActive: true }).sort({ name: 1 });