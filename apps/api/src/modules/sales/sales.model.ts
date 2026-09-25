import { Schema, model, type InferSchemaType } from "mongoose";

const lineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const quoteSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
  lines: { type: [lineSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  taxTotal: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["DRAFT", "SENT", "ACCEPTED", "REJECTED"], required: true, default: "DRAFT" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const orderSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },
  lines: { type: [lineSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  taxTotal: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "PREPARING", "READY_FOR_DELIVERY", "DELIVERED", "CONFIRMED", "REJECTED", "CANCELLED"], required: true, default: "DRAFT" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
  confirmedAt: { type: Date },
  deliveredBy: { type: Schema.Types.ObjectId, ref: "User" },
  deliveredAt: { type: Date },
  rejectionReason: { type: String, trim: true, maxlength: 300 }
}, { timestamps: true });
orderSchema.index({ companyId: 1, quoteId: 1 }, { unique: true, partialFilterExpression: { quoteId: { $exists: true } } });

const saleSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "SalesOrder", required: true, unique: true },
  lines: { type: [lineSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  taxTotal: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["COMPLETED", "CANCELLED"], required: true, default: "COMPLETED" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export type QuoteDocument = InferSchemaType<typeof quoteSchema>;
export type SalesOrderDocument = InferSchemaType<typeof orderSchema>;
export type SaleDocument = InferSchemaType<typeof saleSchema>;

export const QuoteModel = model("Quote", quoteSchema);
export const SalesOrderModel = model("SalesOrder", orderSchema);
export const SaleModel = model("Sale", saleSchema);
