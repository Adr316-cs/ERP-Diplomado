import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { CategoryModel } from "../src/modules/categories/category.model.js";
import { SupplierModel } from "../src/modules/suppliers/supplier.model.js";
import { WarehouseModel } from "../src/modules/warehouses/warehouse.model.js";
import { ProductModel } from "../src/modules/products/product.model.js";
import { TaxModel } from "../src/modules/master-data/master-data.model.js";
import { InventoryModel } from "../src/modules/inventory/inventory.model.js";
import { InventoryMovementModel } from "../src/modules/inventory/inventory-movement.model.js";
import { AccountModel, AccountsPayableModel, FinanceTransactionModel, PaymentModel } from "../src/modules/finance/finance.model.js";
import { approvePurchaseOrder, approvePurchaseRequest, createPurchaseQuotation, createPurchaseRequest, receivePurchaseOrder, requestPurchaseApproval, requestPurchaseRequestApproval, selectPurchaseQuotation, submitPurchaseOrder, submitPurchaseRequest } from "../src/modules/purchases/purchases.service.js";
import { createAccount, recordPayment } from "../src/modules/finance/finance.service.js";

test("replica set runs the purchase request-to-payment flow atomically", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => {
    await disconnectDatabase();
    await replicaSet.stop();
  });
  await connectDatabase(replicaSet.getUri());

  const buyerId = new Types.ObjectId();
  const approverId = new Types.ObjectId();
  const warehouseUserId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "Integration Co", createdBy: buyerId });
  const branch = await BranchModel.create({ companyId: company._id, name: "Main", code: "MAIN", createdBy: buyerId });
  const warehouse = await WarehouseModel.create({ companyId: company._id, branchId: branch._id, name: "Primary", code: "PRIMARY", createdBy: buyerId });
  const category = await CategoryModel.create({ companyId: company._id, name: "Parts", code: "PARTS", createdBy: buyerId });
  const supplier = await SupplierModel.create({ companyId: company._id, name: "Supplier One", createdBy: buyerId });
  const tax = await TaxModel.create({ companyId: company._id, name: "VAT", code: "VAT16", rate: 16, isInclusive: false, createdBy: buyerId });
  const product = await ProductModel.create({ companyId: company._id, categoryId: category._id, taxId: tax._id, sku: "PART-1", name: "Part One", cost: 90, unitPrice: 150, createdBy: buyerId });
  const companyId = company._id.toString();
  const branchId = branch._id.toString();
  const warehouseId = warehouse._id.toString();
  const supplierId = supplier._id.toString();
  const productId = product._id.toString();

  const purchaseRequest = await createPurchaseRequest(buyerId.toString(), companyId, {
    branchId, warehouseId, reason: "Replenish essential stock", lines: [{ productId, quantity: 2 }]
  });
  const requestId = purchaseRequest._id.toString();
  await submitPurchaseRequest(companyId, requestId);
  await requestPurchaseRequestApproval(companyId, requestId);
  await approvePurchaseRequest(approverId.toString(), companyId, requestId);

  const quotation = await createPurchaseQuotation(buyerId.toString(), companyId, {
    purchaseRequestId: requestId, supplierId, lines: [{ productId, quantity: 2, unitCost: 100 }]
  });
  const order = await selectPurchaseQuotation(buyerId.toString(), companyId, quotation._id.toString());
  assert.equal(order?.status, "DRAFT");
  assert.equal(order?.subtotal, 200);
  assert.equal(order?.taxTotal, 32);
  assert.equal(order?.total, 232);

  const orderId = order!._id.toString();
  await submitPurchaseOrder(companyId, orderId);
  await requestPurchaseApproval(companyId, orderId);
  await approvePurchaseOrder(approverId.toString(), companyId, orderId);
  await receivePurchaseOrder(warehouseUserId.toString(), companyId, orderId);

  assert.equal(await InventoryModel.findOne({ companyId, warehouseId, productId }).then((stock) => stock?.quantity), 2);
  assert.equal(await InventoryMovementModel.countDocuments({ companyId, productId, type: "IN" }), 1);
  const payable = await AccountsPayableModel.findOne({ companyId, purchaseOrderId: orderId });
  assert.equal(payable?.status, "OPEN");
  assert.equal(payable?.outstandingAmount, 232);

  const account = await createAccount(buyerId.toString(), companyId, { name: "Operating", code: "OPERATING", type: "BANK", currency: "MXN" });
  await recordPayment(buyerId.toString(), companyId, { accountId: account._id.toString(), type: "SUPPLIER", amount: 100, purchaseOrderId: orderId });
  assert.equal(await AccountsPayableModel.findOne({ companyId, purchaseOrderId: orderId }).then((value) => value?.status), "PARTIAL");
  assert.equal(await AccountsPayableModel.findOne({ companyId, purchaseOrderId: orderId }).then((value) => value?.outstandingAmount), 132);
  await assert.rejects(
    recordPayment(buyerId.toString(), companyId, { accountId: account._id.toString(), type: "SUPPLIER", amount: 133, purchaseOrderId: orderId }),
    (error: unknown) => error instanceof Error && "statusCode" in error && error.statusCode === 409
  );
  await recordPayment(buyerId.toString(), companyId, { accountId: account._id.toString(), type: "SUPPLIER", amount: 132, purchaseOrderId: orderId });
  assert.equal(await AccountsPayableModel.findOne({ companyId, purchaseOrderId: orderId }).then((value) => value?.status), "PAID");
  assert.equal(await PaymentModel.countDocuments({ companyId, purchaseOrderId: orderId }), 2);
  assert.equal(await FinanceTransactionModel.countDocuments({ companyId, purchaseOrderId: orderId, type: "EXPENSE", paymentId: { $exists: true } }), 2);
  assert.equal(await AccountModel.findById(account._id).then((value) => value?.balance), -232);
});
