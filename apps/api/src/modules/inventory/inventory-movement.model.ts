import { Schema, model, type InferSchemaType } from "mongoose";

const movementSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
  destinationWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse" },
  type: { type: String, enum: ["IN", "OUT", "ADJUSTMENT", "TRANSFER"], required: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  reason: { type: String, required: true, trim: true, maxlength: 300 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

movementSchema.index({ companyId: 1, createdAt: -1 });

export type InventoryMovementDocument = InferSchemaType<typeof movementSchema>;
export const InventoryMovementModel = model("InventoryMovement", movementSchema);