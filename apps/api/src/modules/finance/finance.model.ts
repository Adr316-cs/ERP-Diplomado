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
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
transactionSchema.index({ companyId: 1, createdAt: -1 });

const paymentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  type: { type: String, enum: ["CUSTOMER", "SUPPLIER"], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  saleId: { type: Schema.Types.ObjectId, ref: "Sale" },
  purchaseOrderId: { type: Schema.Types.ObjectId, ref: "PurchaseOrder" },
  reference: { type: String, trim: true, maxlength: 120 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
paymentSchema.index({ companyId: 1, createdAt: -1 });

export type AccountDocument = InferSchemaType<typeof accountSchema>;
export type FinanceTransactionDocument = InferSchemaType<typeof transactionSchema>;
export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const AccountModel = model("Account", accountSchema);
export const FinanceTransactionModel = model("FinanceTransaction", transactionSchema);
export const PaymentModel = model("Payment", paymentSchema);