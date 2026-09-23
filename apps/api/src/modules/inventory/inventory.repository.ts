import { Types } from "mongoose";
import { InventoryModel } from "./inventory.model.js";
import { InventoryMovementModel } from "./inventory-movement.model.js";

export const findInventoryByCompany = (companyId: string) =>
  InventoryModel.find({ companyId: new Types.ObjectId(companyId) }).populate("productId warehouseId").sort({ updatedAt: -1 });

export const findInventory = (companyId: string, warehouseId: string | Types.ObjectId, productId: string, session: import("mongoose").ClientSession) =>
  InventoryModel.findOne({ companyId, warehouseId, productId }).session(session);

export const createMovement = (input: Record<string, unknown>, session: import("mongoose").ClientSession) =>
  InventoryMovementModel.create([input], { session });