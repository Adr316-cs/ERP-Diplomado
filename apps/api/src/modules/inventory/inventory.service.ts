import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { ProductModel } from "../products/product.model.js";
import { WarehouseModel } from "../warehouses/warehouse.model.js";
import { InventoryModel } from "./inventory.model.js";
import { createMovement, findInventory, findInventoryByCompany, findInventoryMovementsByCompany } from "./inventory.repository.js";

type MovementInput = {
  productId: string;
  warehouseId: string;
  destinationWarehouseId?: string | undefined;
  type: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  reason: string;
};

export const calculateNextStock = (current: number, type: MovementInput["type"], quantity: number): number => {
  const next = type === "IN" || type === "RETURN" ? current + quantity : current - quantity;
  if (type === "ADJUSTMENT") return quantity;
  if (next < 0) throw new HttpError(409, "INSUFFICIENT_STOCK", "Existencias insuficientes");
  return next;
};

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

const assertObjectId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invÃ¡lido`);
};

type BranchAccess = { branchId?: string | undefined; branchIds: string[]; isCompanyOwner: boolean };

const getWarehouse = async (companyId: string, warehouseId: string, session: mongoose.ClientSession, branchAccess: BranchAccess, role: "source" | "destination") => {
  assertObjectId(warehouseId, "INVALID_WAREHOUSE_ID", "Identificador de almacén");
  const warehouse = await WarehouseModel.findOne({ _id: warehouseId, companyId, isActive: true }).session(session);
  if (!warehouse) throw new HttpError(400, "WAREHOUSE_COMPANY_MISMATCH", "El almacén no pertenece a la empresa");
  const warehouseBranchId = warehouse.branchId.toString();
  if (!branchAccess.isCompanyOwner && !branchAccess.branchIds.includes(warehouseBranchId)) {
    throw new HttpError(403, "BRANCH_ACCESS_DENIED", "No tienes acceso a la sucursal del almacén");
  }
  if (role === "source" && branchAccess.branchId && branchAccess.branchId !== warehouseBranchId) {
    throw new HttpError(403, "BRANCH_CONTEXT_MISMATCH", "El almacén no pertenece a la sucursal seleccionada");
  }
  return warehouse;
};
export const recordMovement = async (userId: string, companyId: string, input: MovementInput, branchAccess: BranchAccess = { branchIds: [], isCompanyOwner: true }) => {
  databaseRequired();
  assertObjectId(input.productId, "INVALID_PRODUCT_ID", "Identificador de producto");
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      const product = await ProductModel.findOne({ _id: input.productId, companyId, isActive: true }).session(session);
      if (!product) throw new HttpError(400, "PRODUCT_COMPANY_MISMATCH", "El producto no pertenece a la empresa");

      const sourceWarehouse = await getWarehouse(companyId, input.warehouseId, session, branchAccess, "source");
      const sourceInventory = await findInventory(companyId, sourceWarehouse._id, input.productId, session);
      const currentSource = sourceInventory?.quantity ?? 0;

      if (input.type === "TRANSFER") {
        if (!input.destinationWarehouseId || input.destinationWarehouseId === input.warehouseId) {
          throw new HttpError(400, "INVALID_TRANSFER", "La transferencia requiere un almacÃ©n destino distinto");
        }
        const destinationWarehouse = await getWarehouse(companyId, input.destinationWarehouseId, session, branchAccess, "destination");
        const nextSource = calculateNextStock(currentSource, "OUT", input.quantity);
        const destinationInventory = await findInventory(companyId, destinationWarehouse._id, input.productId, session);
        if (sourceInventory) {
          sourceInventory.quantity = nextSource;
          sourceInventory.updatedBy = new Types.ObjectId(userId);
          await sourceInventory.save({ session });
        } else {
          throw new HttpError(409, "INSUFFICIENT_STOCK", "Existencias insuficientes");
        }
        if (destinationInventory) {
          destinationInventory.quantity += input.quantity;
          destinationInventory.updatedBy = new Types.ObjectId(userId);
          await destinationInventory.save({ session });
        } else {
          await InventoryModel.create([{ companyId, warehouseId: destinationWarehouse._id, productId: input.productId, quantity: input.quantity, updatedBy: userId }], { session });
        }
      } else {
        const nextQuantity = calculateNextStock(currentSource, input.type, input.quantity);
        if (sourceInventory) {
          sourceInventory.quantity = nextQuantity;
          sourceInventory.updatedBy = new Types.ObjectId(userId);
          await sourceInventory.save({ session });
        } else {
          await InventoryModel.create([{ companyId, warehouseId: sourceWarehouse._id, productId: input.productId, quantity: nextQuantity, updatedBy: userId }], { session });
        }
      }

      const movement = await createMovement({ ...input, companyId, createdBy: userId }, session);
      result = movement[0];
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const listInventory = async (companyId: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  const scoped = Object.keys(branchFilter).length > 0;
  const warehouseIds = scoped ? await WarehouseModel.find({ companyId, ...branchFilter }).distinct("_id") : undefined;
  return findInventoryByCompany(companyId, warehouseIds);
};

export const listInventoryMovements = async (companyId: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  const scoped = Object.keys(branchFilter).length > 0;
  const warehouseIds = scoped ? await WarehouseModel.find({ companyId, ...branchFilter }).distinct("_id") : undefined;
  return findInventoryMovementsByCompany(companyId, warehouseIds);
};



