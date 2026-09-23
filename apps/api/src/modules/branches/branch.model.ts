import { Schema, model, type InferSchemaType } from "mongoose";

const branchSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  address: { type: String, trim: true, maxlength: 300 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

branchSchema.index({ companyId: 1, code: 1 }, { unique: true });

export type BranchDocument = InferSchemaType<typeof branchSchema>;
export const BranchModel = model("Branch", branchSchema);