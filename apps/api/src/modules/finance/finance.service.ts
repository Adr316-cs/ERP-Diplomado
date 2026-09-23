import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { PurchaseOrderModel } from "../purchases/purchases.model.js";
import { SaleModel } from "../sales/sales.model.js";
import { AccountModel, FinanceTransactionModel, PaymentModel } from "./finance.model.js";

type AccountInput = { name: string; code: string; type: "CASH" | "BANK" | "RECEIVABLE" | "PAYABLE" | "OTHER"; currency: string };
type TransactionInput = { accountId: string; type: "INCOME" | "EXPENSE"; amount: number; description: string; saleId?: string | undefined; purchaseOrderId?: string | undefined };
type PaymentInput = { accountId: string; type: "CUSTOMER" | "SUPPLIER"; amount: number; saleId?: string | undefined; purchaseOrderId?: string | undefined; reference?: string | undefined };

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};
const money = (amount: number) => Number(amount.toFixed(2));
const assertId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`);
};

export const createAccount = async (userId: string, companyId: string, input: AccountInput) => {
  databaseRequired();
  return AccountModel.create({ ...input, companyId, createdBy: userId });
};
export const listAccounts = async (companyId: string) => {
  databaseRequired();
  return AccountModel.find({ companyId, isActive: true }).sort({ name: 1 });
};
export const recordTransaction = async (userId: string, companyId: string, input: TransactionInput) => {
  databaseRequired();
  assertId(input.accountId, "INVALID_ACCOUNT_ID", "Cuenta");
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const account = await AccountModel.findOne({ _id: input.accountId, companyId, isActive: true }).session(session);
      if (!account) throw new HttpError(400, "ACCOUNT_COMPANY_MISMATCH", "La cuenta no pertenece a la empresa");
      const amount = money(input.amount);
      account.balance = money(account.balance + (input.type === "INCOME" ? amount : -amount));
      await account.save({ session });
      const created = await FinanceTransactionModel.create([{ ...input, amount, companyId, createdBy: userId }], { session });
      result = created[0];
    });
    return result;
  } finally { await session.endSession(); }
};

export const recordPayment = async (userId: string, companyId: string, input: PaymentInput) => {
  databaseRequired();
  assertId(input.accountId, "INVALID_ACCOUNT_ID", "Cuenta");
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const account = await AccountModel.findOne({ _id: input.accountId, companyId, isActive: true }).session(session);
      if (!account) throw new HttpError(400, "ACCOUNT_COMPANY_MISMATCH", "La cuenta no pertenece a la empresa");
      if (input.type === "CUSTOMER") {
        assertId(input.saleId!, "INVALID_SALE_ID", "Venta");
        if (!await SaleModel.exists({ _id: input.saleId, companyId, status: "COMPLETED" }).session(session)) throw new HttpError(400, "SALE_COMPANY_MISMATCH", "La venta no pertenece a la empresa");
      } else {
        assertId(input.purchaseOrderId!, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
        if (!await PurchaseOrderModel.exists({ _id: input.purchaseOrderId, companyId, status: "RECEIVED" }).session(session)) throw new HttpError(400, "PURCHASE_ORDER_COMPANY_MISMATCH", "La orden no pertenece a la empresa");
      }
      const amount = money(input.amount);
      account.balance = money(account.balance + (input.type === "CUSTOMER" ? amount : -amount));
      await account.save({ session });
      const created = await PaymentModel.create([{ ...input, amount, companyId, createdBy: userId }], { session });
      result = created[0];
    });
    return result;
  } finally { await session.endSession(); }
};