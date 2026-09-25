import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { PurchaseOrderModel } from "../purchases/purchases.model.js";
import { SalesOrderModel } from "../sales/sales.model.js";
import { deactivateWarehouseInCompany, findWarehouseInCompany, updateWarehouseInCompany } from "./warehouse.repository.js";
import { validateCatalogId } from "../../shared/catalog-mutations.js";
import { createWarehouse, findWarehousesByCompany } from "./warehouse.repository.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

export const registerWarehouse = async (userId: string, companyId: string, input: { branchId: string; name: string; code: string }) => {
  databaseRequired();
  if (!Types.ObjectId.isValid(input.branchId) || !await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) {
    throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  }
  return createWarehouse({ ...input, companyId, createdBy: userId });
};

export const listWarehouses = async (companyId: string, query: import("../../shared/catalog-query.js").CatalogQuery, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  return findWarehousesByCompany(companyId, query, branchFilter);
};


export const updateWarehouse = async (companyId: string, id: string, input: { branchId?: string | undefined; name?: string | undefined; code?: string | undefined }, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  if (input.branchId && (!Types.ObjectId.isValid(input.branchId) || !await BranchModel.exists({ _id: input.branchId, companyId, isActive: true }))) {
    throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  }
  const warehouse = await updateWarehouseInCompany(companyId, id, input, branchFilter);
  if (!warehouse) throw new HttpError(404, "WAREHOUSE_NOT_FOUND", "Almacén no encontrado");
  return warehouse;
};

export const deactivateWarehouse = async (companyId: string, id: string, branchFilter: Record<string, unknown>) => {
  databaseRequired();
  validateCatalogId(id);
  const [hasStock, hasOpenPurchase, hasOpenSale] = await Promise.all([
    InventoryModel.exists({ companyId, warehouseId: id, quantity: { $gt: 0 } }),
    PurchaseOrderModel.exists({ companyId, warehouseId: id, status: { $in: ["DRAFT", "APPROVED"] } }),
    SalesOrderModel.exists({ companyId, warehouseId: id, status: "DRAFT" })
  ]);
  if (hasStock || hasOpenPurchase || hasOpenSale) throw new HttpError(409, "WAREHOUSE_IN_USE", "No se puede dar de baja un almacén con existencias u órdenes abiertas");
  const warehouse = await deactivateWarehouseInCompany(companyId, id, branchFilter);
  if (!warehouse) throw new HttpError(404, "WAREHOUSE_NOT_FOUND", "Almacén no encontrado");
  return warehouse;
};

export const getWarehouse = async (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  validateCatalogId(id);
  const record = findWarehouseInCompany(companyId, id, branchFilter);
  const found = await record;
  if (!found) throw new HttpError(404, "WAREHOUSE_NOT_FOUND", "Almacén no encontrado");
  return found;
};
