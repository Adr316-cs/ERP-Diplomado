import { Schema, model, type InferSchemaType } from "mongoose";

const productSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 60 },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 500 },
  unitPrice: { type: Number, required: true, min: 0 },
  stockMinimum: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

productSchema.index({ companyId: 1, sku: 1 }, { unique: true });

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = model("Product", productSchema);