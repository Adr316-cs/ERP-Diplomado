import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { CategoryModel } from "../src/modules/categories/category.model.js";
import { CustomerModel } from "../src/modules/customers/customer.model.js";
import { WarehouseModel } from "../src/modules/warehouses/warehouse.model.js";
import { ProductModel } from "../src/modules/products/product.model.js";
import { TaxModel } from "../src/modules/master-data/master-data.model.js";
import { InventoryModel } from "../src/modules/inventory/inventory.model.js";
import { InventoryMovementModel } from "../src/modules/inventory/inventory-movement.model.js";
import { AccountModel, AccountsReceivableModel, FinanceTransactionModel, PaymentModel } from "../src/modules/finance/finance.model.js";
import { SaleModel, SalesOrderModel } from "../src/modules/sales/sales.model.js";
import { approveSalesOrder, createOrderFromQuote, deliverSalesOrder, readySalesOrder, registerQuote, requestSalesApproval, startSalesPreparation, submitSalesOrder, updateQuoteStatus } from "../src/modules/sales/sales.service.js";
import { recordPayment } from "../src/modules/finance/finance.service.js";

test("replica set runs the sales quote-to-invoice and partial-payment flow atomically", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => {
    await disconnectDatabase();
    await replicaSet.stop();
  });
  await connectDatabase(replicaSet.getUri());

  const sellerId = new Types.ObjectId();
  const approverId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "Sales Integration Co", createdBy: sellerId });
  const branch = await BranchModel.create({ companyId: company._id, name: "Main", code: "MAIN", createdBy: sellerId });
  const warehouse = await WarehouseModel.create({ companyId: company._id, branchId: branch._id, name: "Primary", code: "PRIMARY", createdBy: sellerId });
  const category = await CategoryModel.create({ companyId: company._id, name: "Parts", code: "PARTS", createdBy: sellerId });
  const customer = await CustomerModel.create({ companyId: company._id, name: "Customer One", createdBy: sellerId });
  const tax = await TaxModel.create({ companyId: company._id, name: "VAT", code: "VAT16", rate: 16, isInclusive: false, createdBy: sellerId });
  const product = await ProductModel.create({ companyId: company._id, categoryId: category._id, taxId: tax._id, sku: "SALE-1", name: "Part One", cost: 50, unitPrice: 100, createdBy: sellerId });
  const secondProduct = await ProductModel.create({ companyId: company._id, categoryId: category._id, taxId: tax._id, sku: "SALE-2", name: "Part Two", cost: 50, unitPrice: 100, createdBy: sellerId });
  const companyId = company._id.toString();
  const productId = product._id.toString();
  const secondProductId = secondProduct._id.toString();
  const warehouseId = warehouse._id.toString();
  await InventoryModel.create({ companyId, warehouseId, productId, quantity: 10, updatedBy: sellerId });
  await InventoryModel.create({ companyId, warehouseId, productId: secondProductId, quantity: 10, updatedBy: sellerId });

  const quote = await registerQuote(sellerId.toString(), companyId, {
    branchId: branch._id.toString(), customerId: customer._id.toString(),
    lines: [{ productId, quantity: 2, unitPrice: 1 }, { productId: secondProductId, quantity: 2 }]
  });
  assert.equal(quote.subtotal, 400);
  assert.equal(quote.taxTotal, 64);
  assert.equal(quote.total, 464);
  await assert.rejects(createOrderFromQuote(sellerId.toString(), companyId, quote._id.toString(), warehouseId), { code: "QUOTE_NOT_ACCEPTED" });

  await updateQuoteStatus(companyId, quote._id.toString(), "send");
  await updateQuoteStatus(companyId, quote._id.toString(), "accept");
  const order = await createOrderFromQuote(sellerId.toString(), companyId, quote._id.toString(), warehouseId);
  const orderId = order!._id.toString();
  await assert.rejects(createOrderFromQuote(sellerId.toString(), companyId, quote._id.toString(), warehouseId));
  await assert.rejects(submitSalesOrder(companyId, orderId, { branchId: new Types.ObjectId() }), { statusCode: 409 });
  assert.equal((await InventoryModel.findOne({ companyId, warehouseId, productId }))?.quantity, 10);

  await submitSalesOrder(companyId, orderId);
  await requestSalesApproval(companyId, orderId);
  await assert.rejects(approveSalesOrder(sellerId.toString(), companyId, orderId), { statusCode: 403 });
  await approveSalesOrder(approverId.toString(), companyId, orderId);
  await startSalesPreparation(companyId, orderId);
  await readySalesOrder(companyId, orderId);
  const stock = await InventoryModel.findOne({ companyId, warehouseId, productId });
  const secondStock = await InventoryModel.findOne({ companyId, warehouseId, productId: secondProductId });
  secondStock!.quantity = 1;
  await stock!.save();
  await secondStock!.save();
  await assert.rejects(deliverSalesOrder(sellerId.toString(), companyId, orderId), { statusCode: 409 });
  assert.equal(await SalesOrderModel.findById(orderId).then((value) => value?.status), "READY_FOR_DELIVERY");
  assert.equal(await InventoryMovementModel.countDocuments({ companyId, type: "OUT" }), 0);
  assert.equal((await InventoryModel.findOne({ companyId, warehouseId, productId }))?.quantity, 10);
  secondStock!.quantity = 10;
  await secondStock!.save();
  const sale = await deliverSalesOrder(sellerId.toString(), companyId, orderId);

  assert.equal(sale?.total, 464);
  assert.equal(await SalesOrderModel.findById(orderId).then((value) => value?.status), "DELIVERED");
  assert.equal(await InventoryModel.findOne({ companyId, warehouseId, productId }).then((value) => value?.quantity), 8);
  assert.equal(await InventoryModel.findOne({ companyId, warehouseId, productId: secondProductId }).then((value) => value?.quantity), 8);
  assert.equal(await InventoryMovementModel.countDocuments({ companyId, type: "OUT" }), 2);
  assert.equal(await SaleModel.countDocuments({ companyId, orderId }), 1);
  assert.equal(await AccountsReceivableModel.findOne({ companyId, saleId: sale?._id }).then((value) => value?.outstandingAmount), 464);

  const account = await AccountModel.create({ companyId, name: "Operating", code: "OPERATING", type: "BANK", currency: "MXN", createdBy: sellerId });
  await recordPayment(sellerId.toString(), companyId, { accountId: account._id.toString(), type: "CUSTOMER", amount: 100, saleId: sale!._id.toString() });
  assert.equal(await AccountsReceivableModel.findOne({ companyId, saleId: sale?._id }).then((value) => value?.status), "PARTIAL");
  await assert.rejects(recordPayment(sellerId.toString(), companyId, { accountId: account._id.toString(), type: "CUSTOMER", amount: 365, saleId: sale!._id.toString() }), { statusCode: 409 });
  await recordPayment(sellerId.toString(), companyId, { accountId: account._id.toString(), type: "CUSTOMER", amount: 364, saleId: sale!._id.toString() });
  assert.equal(await AccountsReceivableModel.findOne({ companyId, saleId: sale?._id }).then((value) => value?.status), "PAID");
  assert.equal(await PaymentModel.countDocuments({ companyId, saleId: sale?._id }), 2);
  assert.equal(await FinanceTransactionModel.countDocuments({ companyId, saleId: sale?._id, type: "INCOME", paymentId: { $exists: true } }), 2);
});
