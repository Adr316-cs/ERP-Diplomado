import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { InventoryMovementModel } from "../inventory/inventory-movement.model.js";
import { ProductModel } from "../products/product.model.js";
import { SupplierModel } from "../suppliers/supplier.model.js";
import { WarehouseModel } from "../warehouses/warehouse.model.js";
import { createPurchaseOrder, findPurchaseOrderById, findPurchaseOrdersByCompany } from "./purchases.repository.js";
import type { PurchaseLine, PurchaseLineInput } from "./purchases.types.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

const assertObjectId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`);
};

const validateContext = async (companyId: string, input: { branchId: string; warehouseId: string; supplierId: string }) => {
  assertObjectId(input.branchId, "INVALID_BRANCH_ID", "Sucursal");
  assertObjectId(input.warehouseId, "INVALID_WAREHOUSE_ID", "Almacén");
  assertObjectId(input.supplierId, "INVALID_SUPPLIER_ID", "Proveedor");
  const [branch, warehouse, supplier] = await Promise.all([
    BranchModel.exists({ _id: input.branchId, companyId, isActive: true }),
    WarehouseModel.exists({ _id: input.warehouseId, companyId, isActive: true }),
    SupplierModel.exists({ _id: input.supplierId, companyId, isActive: true })
  ]);
  if (!branch) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  if (!warehouse) throw new HttpError(400, "WAREHOUSE_COMPANY_MISMATCH", "El almacén no pertenece a la empresa");
  if (!supplier) throw new HttpError(400, "SUPPLIER_COMPANY_MISMATCH", "El proveedor no pertenece a la empresa");
};

const prepareLines = async (companyId: string, lines: PurchaseLineInput[]): Promise<PurchaseLine[]> => {
  const prepared: PurchaseLine[] = [];
  for (const line of lines) {
    assertObjectId(line.productId, "INVALID_PRODUCT_ID", "Producto");
    const product = await ProductModel.findOne({ _id: line.productId, companyId, isActive: true });
    if (!product) throw new HttpError(400, "PRODUCT_COMPANY_MISMATCH", "El producto no pertenece a la empresa");
    prepared.push({ ...line, total: Number((line.unitCost * line.quantity).toFixed(2)) });
  }
  return prepared;
};

export const registerPurchaseOrder = async (userId: string, companyId: string, input: { branchId: string; warehouseId: string; supplierId: string; lines: PurchaseLineInput[] }) => {
  databaseRequired();
  await validateContext(companyId, input);
  const lines = await prepareLines(companyId, input.lines);
  const subtotal = Number(lines.reduce((sum, line) => sum + line.total, 0).toFixed(2));
  return createPurchaseOrder({ ...input, lines, subtotal, total: subtotal, companyId, createdBy: userId });
};

export const listPurchaseOrders = async (companyId: string) => {
  databaseRequired();
  return findPurchaseOrdersByCompany(companyId);
};

export const approvePurchaseOrder = async (userId: string, companyId: string, orderId: string) => {
  databaseRequired();
  assertObjectId(orderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
  const order = await findPurchaseOrderById(companyId, orderId);
  if (!order) throw new HttpError(404, "PURCHASE_ORDER_NOT_FOUND", "Orden de compra no encontrada");
  if (order.status !== "DRAFT") throw new HttpError(409, "PURCHASE_ORDER_STATE_INVALID", "La orden no está en borrador");
  order.status = "APPROVED";
  order.approvedBy = new Types.ObjectId(userId);
  order.approvedAt = new Date();
  await order.save();
  return order;
};

export const receivePurchaseOrder = async (userId: string, companyId: string, orderId: string) => {
  databaseRequired();
  assertObjectId(orderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
  const session = await mongoose.startSession();
  try {
    let receivedOrder;
    await session.withTransaction(async () => {
      const order = await findPurchaseOrderById(companyId, orderId, session);
      if (!order) throw new HttpError(404, "PURCHASE_ORDER_NOT_FOUND", "Orden de compra no encontrada");
      if (order.status !== "APPROVED") throw new HttpError(409, "PURCHASE_ORDER_STATE_INVALID", "La orden debe estar aprobada antes de recibirla");

      for (const line of order.lines) {
        const inventory = await InventoryModel.findOne({ companyId, warehouseId: order.warehouseId, productId: line.productId }).session(session);
        if (inventory) {
          inventory.quantity += line.quantity;
          inventory.updatedBy = new Types.ObjectId(userId);
          await inventory.save({ session });
        } else {
          await InventoryModel.create([{ companyId, warehouseId: order.warehouseId, productId: line.productId, quantity: line.quantity, updatedBy: userId }], { session });
        }
        await InventoryMovementModel.create([{ companyId, productId: line.productId, warehouseId: order.warehouseId, type: "IN", quantity: line.quantity, reason: `Recepción de orden ${order._id.toString()}`, createdBy: userId }], { session });
      }

      order.status = "RECEIVED";
      order.receivedAt = new Date();
      await order.save({ session });
      receivedOrder = order;
    });
    return receivedOrder;
  } finally {
    await session.endSession();
  }
};