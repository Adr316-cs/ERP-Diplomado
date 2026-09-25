import { Schema, model, type InferSchemaType } from "mongoose";

const brandSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  description: { type: String, trim: true, maxlength: 300 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
brandSchema.index({ companyId: 1, code: 1 }, { unique: true });

const unitSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  symbol: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
  decimalPlaces: { type: Number, required: true, min: 0, max: 6, default: 0 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
unitSchema.index({ companyId: 1, symbol: 1 }, { unique: true });

const taxSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  rate: { type: Number, required: true, min: 0, max: 100 },
  isInclusive: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
taxSchema.index({ companyId: 1, code: 1 }, { unique: true });

const paymentMethodSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  kind: { type: String, enum: ["CASH", "CARD", "BANK_TRANSFER", "CHECK", "OTHER"], required: true },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
paymentMethodSchema.index({ companyId: 1, code: 1 }, { unique: true });

export type BrandDocument = InferSchemaType<typeof brandSchema>;
export type UnitDocument = InferSchemaType<typeof unitSchema>;
export type TaxDocument = InferSchemaType<typeof taxSchema>;
export type PaymentMethodDocument = InferSchemaType<typeof paymentMethodSchema>;
export const BrandModel = model("Brand", brandSchema);
export const UnitModel = model("Unit", unitSchema);
export const TaxModel = model("Tax", taxSchema);
export const PaymentMethodModel = model("PaymentMethod", paymentMethodSchema);
