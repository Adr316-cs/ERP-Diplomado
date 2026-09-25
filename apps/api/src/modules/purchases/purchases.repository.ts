import { Types } from "mongoose";
import { PurchaseOrderModel } from "./purchases.model.js";

export const findPurchaseOrdersByCompany = (companyId: string, branchFilter: Record<string, unknown> = {}) =>
  PurchaseOrderModel.find({ companyId: new Types.ObjectId(companyId), ...branchFilter }).sort({ createdAt: -1 });
export const findPurchaseOrderById = (companyId: string, orderId: string, session?: import("mongoose").ClientSession) => {
  const query = PurchaseOrderModel.findOne({ _id: orderId, companyId });
  return session ? query.session(session) : query;
};

