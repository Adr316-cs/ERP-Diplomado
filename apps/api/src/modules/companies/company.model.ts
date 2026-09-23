import { Schema, model, type InferSchemaType } from "mongoose";

const companySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  taxId: { type: String, required: false, trim: true, unique: true, sparse: true },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export type CompanyDocument = InferSchemaType<typeof companySchema>;
export const CompanyModel = model("Company", companySchema);