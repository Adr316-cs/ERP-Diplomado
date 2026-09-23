import { Types } from "mongoose";
import { QuoteModel, SaleModel, SalesOrderModel } from "./sales.model.js";

export const createQuote = (input: Record<string, unknown>) => QuoteModel.create(input);
export const createOrder = (input: Record<string, unknown>) => SalesOrderModel.create(input);
export const findQuotesByCompany = (companyId: string) => QuoteModel.find({ companyId: new Types.ObjectId(companyId) }).sort({ createdAt: -1 });
export const findOrdersByCompany = (companyId: string) => SalesOrderModel.find({ companyId: new Types.ObjectId(companyId) }).sort({ createdAt: -1 });
export const findOrderById = (companyId: string, orderId: string, session?: import("mongoose").ClientSession) => {
  const query = SalesOrderModel.findOne({ _id: orderId, companyId });
  return session ? query.session(session) : query;
};
export const createSale = (input: Record<string, unknown>, session: import("mongoose").ClientSession) => SaleModel.create([input], { session });