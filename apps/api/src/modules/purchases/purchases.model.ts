import { Schema, model, type InferSchemaType } from "mongoose";

const lineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  unitCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0, default: 0 },
  taxAmount: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseOrderSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  purchaseRequestId: { type: Schema.Types.ObjectId, ref: "PurchaseRequest" },
  quotationId: { type: Schema.Types.ObjectId, ref: "PurchaseQuotation" },
  lines: { type: [lineSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  taxTotal: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "RECEIVED", "CANCELLED"], required: true, default: "DRAFT" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  receivedAt: { type: Date }
}, { timestamps: true });

purchaseOrderSchema.index({ companyId: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ companyId: 1, quotationId: 1 }, { unique: true, sparse: true });

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model("PurchaseOrder", purchaseOrderSchema);
