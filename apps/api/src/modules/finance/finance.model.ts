import { Schema, model, type InferSchemaType } from "mongoose";

const accountSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  type: { type: String, enum: ["CASH", "BANK", "RECEIVABLE", "PAYABLE", "OTHER"], required: true },
  currency: { type: String, required: true, uppercase: true, length: 3, default: "USD" },
  balance: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
accountSchema.index({ companyId: 1, code: 1 }, { unique: true });

const transactionSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, required: true, trim: true, maxlength: 300 },
  saleId: { type: Schema.Types.ObjectId, ref: "Sale" },
  purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
  paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
transactionSchema.index({ companyId: 1, createdAt: -1 });
transactionSchema.index({ companyId: 1, paymentId: 1 }, { unique: true, partialFilterExpression: { paymentId: { $type: "objectId" } } });

const paymentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  paymentMethodId: { type: Schema.Types.ObjectId, ref: "PaymentMethod" },
  type: { type: String, enum: ["CUSTOMER", "SUPPLIER"], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  saleId: { type: Schema.Types.ObjectId, ref: "Sale" },
  purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
  reference: { type: String, trim: true, maxlength: 120 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
paymentSchema.index({ companyId: 1, createdAt: -1 });

const accountsPayableSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
  originalAmount: { type: Number, required: true, min: 0 },
  outstandingAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["OPEN", "PARTIAL", "PAID"], required: true, default: "OPEN" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
accountsPayableSchema.index({ companyId: 1, purchaseOrderId: 1 }, { unique: true });
accountsPayableSchema.index({ companyId: 1, status: 1, createdAt: -1 });

const accountsReceivableSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
  originalAmount: { type: Number, required: true, min: 0 },
  outstandingAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["OPEN", "PARTIAL", "PAID"], required: true, default: "OPEN" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
accountsReceivableSchema.index({ companyId: 1, saleId: 1 }, { unique: true });
accountsReceivableSchema.index({ companyId: 1, status: 1, createdAt: -1 });

const budgetSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
budgetSchema.index({ companyId: 1, code: 1, periodStart: 1 }, { unique: true });
budgetSchema.index({ companyId: 1, periodStart: 1, periodEnd: 1, type: 1 });

export type AccountDocument = InferSchemaType<typeof accountSchema>;
export type FinanceTransactionDocument = InferSchemaType<typeof transactionSchema>;
export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export type AccountsPayableDocument = InferSchemaType<typeof accountsPayableSchema>;
export type AccountsReceivableDocument = InferSchemaType<typeof accountsReceivableSchema>;
export type BudgetDocument = InferSchemaType<typeof budgetSchema>;
export const AccountModel = model("Account", accountSchema);
export const FinanceTransactionModel = model("FinanceTransaction", transactionSchema);
export const PaymentModel = model("Payment", paymentSchema);
export const AccountsPayableModel = model("AccountsPayable", accountsPayableSchema);
export const AccountsReceivableModel = model("AccountsReceivable", accountsReceivableSchema);
export const BudgetModel = model("Budget", budgetSchema);

