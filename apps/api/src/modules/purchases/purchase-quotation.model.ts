import { Schema, model, type InferSchemaType } from "mongoose";

const quotationLineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  unitCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseQuotationSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  purchaseRequestId: { type: Schema.Types.ObjectId, ref: "PurchaseRequest", required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  lines: { type: [quotationLineSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  taxTotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  validUntil: { type: Date },
  terms: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ["OPEN", "SELECTED", "REJECTED"], required: true, default: "OPEN" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

purchaseQuotationSchema.index({ companyId: 1, purchaseRequestId: 1, supplierId: 1 }, { unique: true });
purchaseQuotationSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export type PurchaseQuotationDocument = InferSchemaType<typeof purchaseQuotationSchema>;
export const PurchaseQuotationModel = model("PurchaseQuotation", purchaseQuotationSchema);
