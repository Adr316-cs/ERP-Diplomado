import { Schema, model, type InferSchemaType } from "mongoose";

const purchaseRequestLineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 0.000001 }
}, { _id: false });

const purchaseRequestSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  lines: { type: [purchaseRequestLineSchema], required: true },
  status: { type: String, enum: ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "CONVERTED", "CANCELLED"], required: true, default: "DRAFT" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, trim: true, maxlength: 500 }
}, { timestamps: true });

purchaseRequestSchema.index({ companyId: 1, branchId: 1, status: 1, createdAt: -1 });

export type PurchaseRequestDocument = InferSchemaType<typeof purchaseRequestSchema>;
export const PurchaseRequestModel = model("PurchaseRequest", purchaseRequestSchema);
