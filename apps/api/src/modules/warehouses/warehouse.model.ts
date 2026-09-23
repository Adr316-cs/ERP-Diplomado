import { Schema, model, type InferSchemaType } from "mongoose";

const warehouseSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

warehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });

export type WarehouseDocument = InferSchemaType<typeof warehouseSchema>;
export const WarehouseModel = model("Warehouse", warehouseSchema);