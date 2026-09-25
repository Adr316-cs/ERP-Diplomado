import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { PurchaseOrderModel } from "../purchases/purchases.model.js";
import { SaleModel } from "../sales/sales.model.js";
import { AccountModel, AccountsPayableModel, AccountsReceivableModel, BudgetModel, FinanceTransactionModel, PaymentModel } from "./finance.model.js";
import { PaymentMethodModel } from "../master-data/master-data.model.js";

type AccountInput = { name: string; code: string; type: "CASH" | "BANK" | "RECEIVABLE" | "PAYABLE" | "OTHER"; currency: string };
type TransactionInput = { accountId: string; type: "INCOME" | "EXPENSE"; amount: number; description: string; saleId?: string | undefined; purchaseOrderId?: string | undefined };
type PaymentInput = { accountId: string; paymentMethodId?: string | undefined; type: "CUSTOMER" | "SUPPLIER"; amount: number; saleId?: string | undefined; purchaseOrderId?: string | undefined; reference?: string | undefined };
type BudgetInput = { code: string; name: string; type: "INCOME" | "EXPENSE"; periodStart: Date; periodEnd: Date; amount: number };

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};
const money = (amount: number) => Number(amount.toFixed(2));
const assertId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invÃ¡lido`);
};

export const createAccount = async (userId: string, companyId: string, input: AccountInput) => {
  databaseRequired();
  return AccountModel.create({ ...input, companyId, createdBy: userId });
};
export const listAccounts = async (companyId: string) => {
  databaseRequired();
  return AccountModel.find({ companyId, isActive: true }).sort({ name: 1 });
};
export const listTransactions = async (companyId: string) => {
  databaseRequired();
  return FinanceTransactionModel.find({ companyId }).populate("accountId", "name code type currency").sort({ createdAt: -1 }).limit(500);
};
export const listPayments = async (companyId: string) => {
  databaseRequired();
  return PaymentModel.find({ companyId }).populate("accountId", "name code type currency").populate("paymentMethodId", "name code").populate("saleId", "status total").populate("purchaseOrderId", "status total").sort({ createdAt: -1 }).limit(500);
};
export const createBudget = async (userId: string, companyId: string, input: BudgetInput) => {
  databaseRequired();
  if (input.periodEnd <= input.periodStart) throw new HttpError(400, "INVALID_BUDGET_PERIOD", "El fin del periodo debe ser posterior al inicio");
  return BudgetModel.create({ ...input, code: input.code.toUpperCase(), companyId, createdBy: userId });
};
export const listBudgets = async (companyId: string) => {
  databaseRequired();
  const budgets = await BudgetModel.find({ companyId, isActive: true }).sort({ periodStart: -1, code: 1 });
  return Promise.all(budgets.map(async (budget) => {
    const periodEndExclusive = new Date(budget.periodEnd);
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1);
    const [totals] = await FinanceTransactionModel.aggregate<{ actualAmount: number }>([
      { $match: { companyId: budget.companyId, type: budget.type, createdAt: { $gte: budget.periodStart, $lt: periodEndExclusive } } },
      { $group: { _id: null, actualAmount: { $sum: "$amount" } } }
    ]);
    const actualAmount = money(totals?.actualAmount ?? 0);
    return { ...budget.toObject(), actualAmount, remainingAmount: money(budget.amount - actualAmount) };
  }));
};
export const listAccountsPayable = async (companyId: string) => {
  databaseRequired();
  return AccountsPayableModel.find({ companyId }).populate("supplierId", "name").populate("purchaseOrderId", "status total").sort({ createdAt: -1 });
};
export const listAccountsReceivable = async (companyId: string) => {
  databaseRequired();
  return AccountsReceivableModel.find({ companyId }).populate("customerId", "name").populate("saleId", "status total").sort({ createdAt: -1 });
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
      if (input.saleId) {
        assertId(input.saleId, "INVALID_SALE_ID", "Venta");
        if (input.type !== "INCOME" || !await SaleModel.exists({ _id: input.saleId, companyId, status: "COMPLETED" }).session(session)) throw new HttpError(400, "SALE_COMPANY_MISMATCH", "La venta no pertenece a la empresa o el tipo no es ingreso");
      }
      if (input.purchaseOrderId) {
        assertId(input.purchaseOrderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
        if (input.type !== "EXPENSE" || !await PurchaseOrderModel.exists({ _id: input.purchaseOrderId, companyId, status: "RECEIVED" }).session(session)) throw new HttpError(400, "PURCHASE_ORDER_COMPANY_MISMATCH", "La compra no pertenece a la empresa o el tipo no es egreso");
      }
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
      if (input.paymentMethodId) {
        assertId(input.paymentMethodId, "INVALID_PAYMENT_METHOD_ID", "Método de pago");
        if (!await PaymentMethodModel.exists({ _id: input.paymentMethodId, companyId, isActive: true }).session(session)) throw new HttpError(400, "PAYMENT_METHOD_COMPANY_MISMATCH", "El método de pago no pertenece a la empresa");
      }
      if (input.type === "CUSTOMER") {
        assertId(input.saleId!, "INVALID_SALE_ID", "Venta");
        if (!await SaleModel.exists({ _id: input.saleId, companyId, status: "COMPLETED" }).session(session)) throw new HttpError(400, "SALE_COMPANY_MISMATCH", "La venta no pertenece a la empresa");
        const receivable = await AccountsReceivableModel.findOne({ companyId, saleId: input.saleId, status: { $in: ["OPEN", "PARTIAL"] } }).session(session);
        if (!receivable) throw new HttpError(409, "ACCOUNTS_RECEIVABLE_CLOSED", "La cuenta por cobrar no existe o ya esta liquidada");
        const paymentAmount = money(input.amount);
        if (paymentAmount > receivable.outstandingAmount) throw new HttpError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago supera el saldo pendiente");
        receivable.outstandingAmount = money(receivable.outstandingAmount - paymentAmount);
        receivable.status = receivable.outstandingAmount === 0 ? "PAID" : "PARTIAL";
        await receivable.save({ session });
      } else {
        assertId(input.purchaseOrderId!, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
        if (!await PurchaseOrderModel.exists({ _id: input.purchaseOrderId, companyId, status: "RECEIVED" }).session(session)) throw new HttpError(400, "PURCHASE_ORDER_COMPANY_MISMATCH", "La orden no pertenece a la empresa");
        const payable = await AccountsPayableModel.findOne({ companyId, purchaseOrderId: input.purchaseOrderId, status: { $in: ["OPEN", "PARTIAL"] } }).session(session);
        if (!payable) throw new HttpError(409, "ACCOUNTS_PAYABLE_CLOSED", "La cuenta por pagar no existe o ya está liquidada");
        const paymentAmount = money(input.amount);
        if (paymentAmount > payable.outstandingAmount) throw new HttpError(409, "PAYMENT_EXCEEDS_BALANCE", "El pago supera el saldo pendiente");
        payable.outstandingAmount = money(payable.outstandingAmount - paymentAmount);
        payable.status = payable.outstandingAmount === 0 ? "PAID" : "PARTIAL";
        await payable.save({ session });
      }
      const amount = money(input.amount);
      account.balance = money(account.balance + (input.type === "CUSTOMER" ? amount : -amount));
      await account.save({ session });
      const created = await PaymentModel.create([{ ...input, amount, companyId, createdBy: userId }], { session });
      const payment = created[0]!;
      await FinanceTransactionModel.create([{
        companyId, accountId: account._id, type: input.type === "CUSTOMER" ? "INCOME" : "EXPENSE", amount,
        description: input.reference || (input.type === "CUSTOMER" ? "Cobro de cliente" : "Pago a proveedor"),
        ...(input.saleId ? { saleId: input.saleId } : {}),
        ...(input.purchaseOrderId ? { purchaseOrderId: input.purchaseOrderId } : {}),
        paymentId: payment._id, createdBy: userId
      }], { session });
      result = payment;
    });
    return result;
  } finally { await session.endSession(); }
};
