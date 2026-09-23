import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { FinanceTransactionModel } from "../finance/finance.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { SaleModel } from "../sales/sales.model.js";
import { PurchaseOrderModel } from "../purchases/purchases.model.js";
import { TicketModel } from "../helpdesk/helpdesk.model.js";

const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible"); };

const withBranchFilter = (branchId?: string) => (branchId ? { branchId: new Types.ObjectId(branchId) } : {});

export const getDashboard = async (companyId: string, branchId?: string) => {
  databaseRequired();
  const companyObjectId = new Types.ObjectId(companyId);
  const matchBase = { companyId: companyObjectId, ...(branchId ? { branchId: new Types.ObjectId(branchId) } : {}) };

  const [sales, purchases, income, expenses, stock, tickets] = await Promise.all([
    SaleModel.aggregate([{ $match: { ...matchBase, status: "COMPLETED" } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }]),
    PurchaseOrderModel.aggregate([{ $match: { ...matchBase, status: "RECEIVED" } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }]),
    FinanceTransactionModel.aggregate([{ $match: { ...matchBase, type: "INCOME" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    FinanceTransactionModel.aggregate([{ $match: { ...matchBase, type: "EXPENSE" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    InventoryModel.aggregate([{ $match: { ...matchBase } }, { $group: { _id: null, units: { $sum: "$quantity" }, products: { $sum: 1 } } }]),
    TicketModel.aggregate([{ $match: { companyId: companyObjectId, ...(branchId ? { branchId: new Types.ObjectId(branchId) } : {}) } }, { $group: { _id: "$status", count: { $sum: 1 } } }])
  ]);

  return {
    sales: sales[0] ?? { count: 0, total: 0 },
    purchases: purchases[0] ?? { count: 0, total: 0 },
    finance: { income: income[0]?.total ?? 0, expenses: expenses[0]?.total ?? 0 },
    inventory: stock[0] ?? { units: 0, products: 0 },
    tickets: Object.fromEntries(tickets.map((item) => [item._id, item.count]))
  };
};

export const getSalesReport = async (companyId: string, from?: Date, to?: Date, branchId?: string) => {
  databaseRequired();
  const match: Record<string, unknown> = { companyId: new Types.ObjectId(companyId), status: "COMPLETED" };
  if (branchId) match.branchId = new Types.ObjectId(branchId);
  if (from || to) match.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  return SaleModel.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } }, count: { $sum: 1 }, total: { $sum: "$total" } } },
    { $sort: { _id: 1 } }
  ]);
};