import { Types } from "mongoose";
import { QuoteModel, SaleModel, SalesOrderModel } from "./sales.model.js";

export const createQuote = (input: Record<string, unknown>, session?: import("mongoose").ClientSession) => session ? QuoteModel.create([input], { session }).then((created) => created[0]!) : QuoteModel.create(input);
export const createOrder = (input: Record<string, unknown>) => SalesOrderModel.create(input);
export const findQuotesByCompany = (companyId: string, branchFilter: Record<string, unknown> = {}) => QuoteModel.find({ companyId: new Types.ObjectId(companyId), ...branchFilter }).sort({ createdAt: -1 });
export const findOrdersByCompany = (companyId: string, branchFilter: Record<string, unknown> = {}) => SalesOrderModel.find({ companyId: new Types.ObjectId(companyId), ...branchFilter }).sort({ createdAt: -1 });
export const findSalesByCompany = (companyId: string, branchFilter: Record<string, unknown> = {}) => SaleModel.find({ companyId: new Types.ObjectId(companyId), ...branchFilter }).populate("customerId", "name").populate("orderId", "status").sort({ createdAt: -1 });
export const findOrderById = (companyId: string, orderId: string, session?: import("mongoose").ClientSession, branchFilter: Record<string, unknown> = {}) => {
  const query = SalesOrderModel.findOne({ _id: orderId, companyId, ...branchFilter });
  return session ? query.session(session) : query;
};
export const findQuoteById = (companyId: string, quoteId: string, session?: import("mongoose").ClientSession, branchFilter: Record<string, unknown> = {}) => {
  const query = QuoteModel.findOne({ _id: quoteId, companyId, ...branchFilter });
  return session ? query.session(session) : query;
};
export const createSale = (input: Record<string, unknown>, session: import("mongoose").ClientSession) => SaleModel.create([input], { session });
