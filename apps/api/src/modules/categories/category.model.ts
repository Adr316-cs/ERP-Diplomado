import { Schema, model, type InferSchemaType } from "mongoose";

const categorySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  parentCategoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

categorySchema.index({ companyId: 1, code: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model("Category", categorySchema);