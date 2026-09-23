import { Schema, model, type InferSchemaType } from "mongoose";

const inventorySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

inventorySchema.index({ companyId: 1, warehouseId: 1, productId: 1 }, { unique: true });

export type InventoryDocument = InferSchemaType<typeof inventorySchema>;
export const InventoryModel = model("Inventory", inventorySchema);