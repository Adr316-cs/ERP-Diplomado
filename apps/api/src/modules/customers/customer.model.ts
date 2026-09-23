import { Schema, model, type InferSchemaType } from "mongoose";

const customerSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true, maxlength: 40 },
  taxId: { type: String, trim: true, maxlength: 50 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

customerSchema.index({ companyId: 1, email: 1 }, { unique: true, sparse: true });

export type CustomerDocument = InferSchemaType<typeof customerSchema>;
export const CustomerModel = model("Customer", customerSchema);