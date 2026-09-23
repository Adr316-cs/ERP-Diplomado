import { Schema, model, type InferSchemaType } from "mongoose";

const lineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  unitCost: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseOrderSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  lines: { type: [lineSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["DRAFT", "APPROVED", "RECEIVED", "CANCELLED"], required: true, default: "DRAFT" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  receivedAt: { type: Date }
}, { timestamps: true });

purchaseOrderSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model("PurchaseOrder", purchaseOrderSchema);