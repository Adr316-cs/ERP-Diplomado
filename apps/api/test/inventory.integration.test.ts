import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { CategoryModel } from "../src/modules/categories/category.model.js";
import { WarehouseModel } from "../src/modules/warehouses/warehouse.model.js";
import { ProductModel } from "../src/modules/products/product.model.js";
import { InventoryModel } from "../src/modules/inventory/inventory.model.js";
import { InventoryMovementModel } from "../src/modules/inventory/inventory-movement.model.js";
import { listInventoryMovements, recordMovement } from "../src/modules/inventory/inventory.service.js";

const hasCode = (code: string) => (error: unknown) => error instanceof Error && "code" in error && error.code === code;

test("replica set applies stock movements, return and transfers atomically with branch-scoped history", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => {
    await disconnectDatabase();
    await replicaSet.stop();
  });
  await connectDatabase(replicaSet.getUri());

  const userId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "Inventory Integration Co", createdBy: userId });
  const branchA = await BranchModel.create({ companyId: company._id, name: "North", code: "NORTH", createdBy: userId });
  const branchB = await BranchModel.create({ companyId: company._id, name: "South", code: "SOUTH", createdBy: userId });
  const source = await WarehouseModel.create({ companyId: company._id, branchId: branchA._id, name: "Source", code: "SOURCE", createdBy: userId });
  const destination = await WarehouseModel.create({ companyId: company._id, branchId: branchB._id, name: "Destination", code: "DESTINATION", createdBy: userId });
  const category = await CategoryModel.create({ companyId: company._id, name: "Stock", code: "STOCK", createdBy: userId });
  const product = await ProductModel.create({ companyId: company._id, categoryId: category._id, sku: "STOCK-1", name: "Stock Item", cost: 1, unitPrice: 2, createdBy: userId });
  const companyId = company._id.toString();
  const productId = product._id.toString();
  const sourceId = source._id.toString();
  const destinationId = destination._id.toString();
  const branchIds = [branchA._id.toString(), branchB._id.toString()];
  const access = { branchId: branchA._id.toString(), branchIds, isCompanyOwner: false };

  await recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, type: "IN", quantity: 10, reason: "Initial receipt" }, access);
  await recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, type: "RETURN", quantity: 3, reason: "Customer return" }, access);
  await recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, type: "OUT", quantity: 4, reason: "Material issued" }, access);
  await recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, type: "ADJUSTMENT", quantity: 20, reason: "Physical count" }, access);
  await recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, destinationWarehouseId: destinationId, type: "TRANSFER", quantity: 5, reason: "Branch transfer" }, access);

  assert.equal(await InventoryModel.findOne({ companyId, warehouseId: sourceId, productId }).then((stock) => stock?.quantity), 15);
  assert.equal(await InventoryModel.findOne({ companyId, warehouseId: destinationId, productId }).then((stock) => stock?.quantity), 5);
  assert.equal(await InventoryMovementModel.countDocuments({ companyId }), 5);
  const transfer = await InventoryMovementModel.findOne({ companyId, type: "TRANSFER" });
  assert.equal(transfer?.createdBy.toString(), userId.toString());
  assert.equal(transfer?.reason, "Branch transfer");
  assert.ok(transfer?.createdAt instanceof Date);
  assert.equal(transfer?.destinationWarehouseId?.toString(), destinationId);

  await assert.rejects(
    recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, type: "OUT", quantity: 16, reason: "Excess issue" }, access),
    hasCode("INSUFFICIENT_STOCK")
  );
  await assert.rejects(
    recordMovement(userId.toString(), companyId, { productId, warehouseId: sourceId, destinationWarehouseId: destinationId, type: "TRANSFER", quantity: 1, reason: "Unauthorized" }, { branchId: branchA._id.toString(), branchIds: [branchA._id.toString()], isCompanyOwner: false }),
    hasCode("BRANCH_ACCESS_DENIED")
  );
  assert.equal(await InventoryMovementModel.countDocuments({ companyId }), 5);

  const destinationHistory = await listInventoryMovements(companyId, { branchId: branchB._id });
  assert.equal(destinationHistory.length, 1);
  assert.equal(destinationHistory[0]?.type, "TRANSFER");
  assert.equal((await listInventoryMovements(companyId)).length, 5);
});
