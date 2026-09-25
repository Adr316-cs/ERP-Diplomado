import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { UserCompanyModel } from "../src/modules/auth/auth.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { CategoryModel } from "../src/modules/categories/category.model.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { InventoryModel } from "../src/modules/inventory/inventory.model.js";
import { CustomerModel } from "../src/modules/customers/customer.model.js";
import { ProductModel } from "../src/modules/products/product.model.js";
import { WarehouseModel } from "../src/modules/warehouses/warehouse.model.js";
import { createActivity, createInteraction, createLead, createOpportunity, createOpportunityQuote, customerHistory, qualifyLead, setOpportunityStage } from "../src/modules/crm/crm.service.js";
import { OpportunityModel } from "../src/modules/crm/crm.model.js";
import { createOrderFromQuote, deliverSalesOrder, readySalesOrder, requestSalesApproval, startSalesPreparation, submitSalesOrder, updateQuoteStatus, approveSalesOrder } from "../src/modules/sales/sales.service.js";

test("replica set runs CRM lead qualification through sales and customer history", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => {
    await disconnectDatabase();
    await replicaSet.stop();
  });
  await connectDatabase(replicaSet.getUri());

  const sellerId = new Types.ObjectId();
  const approverId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "CRM Integration Co", createdBy: sellerId });
  const branch = await BranchModel.create({ companyId: company._id, name: "Main", code: "MAIN", createdBy: sellerId });
  const warehouse = await WarehouseModel.create({ companyId: company._id, branchId: branch._id, name: "Primary", code: "PRIMARY", createdBy: sellerId });
  await UserCompanyModel.create([
    { userId: sellerId, companyId: company._id, branchIds: [branch._id], isOwner: false, assignedBy: sellerId },
    { userId: approverId, companyId: company._id, branchIds: [branch._id], isOwner: false, assignedBy: sellerId }
  ]);
  const category = await CategoryModel.create({ companyId: company._id, name: "Parts", code: "PARTS", createdBy: sellerId });
  const product = await ProductModel.create({ companyId: company._id, categoryId: category._id, sku: "CRM-PART", name: "Part", cost: 50, unitPrice: 100, createdBy: sellerId });
  await InventoryModel.create({ companyId: company._id, warehouseId: warehouse._id, productId: product._id, quantity: 5, updatedBy: sellerId });
  const companyId = company._id.toString();
  const branchId = branch._id.toString();

  const lead = await createLead(sellerId.toString(), companyId, { branchId, name: "Alex Prospect", email: "alex@example.com", phone: "+5215550101", source: "Web", assignedTo: sellerId.toString() });
  await assert.rejects(createOpportunity(sellerId.toString(), companyId, { leadId: lead._id.toString(), name: "Initial sale", value: 200, assignedTo: sellerId.toString() }), { code: "LEAD_NOT_QUALIFIED" });
  await assert.rejects(qualifyLead(companyId, lead._id.toString(), { branchId: new Types.ObjectId() }), { statusCode: 409 });
  await qualifyLead(companyId, lead._id.toString());
  const opportunity = await createOpportunity(sellerId.toString(), companyId, { branchId, leadId: lead._id.toString(), name: "Parts opportunity", value: 200, assignedTo: sellerId.toString() });
  assert.equal(opportunity.stage, "QUALIFIED");

  await createActivity(sellerId.toString(), companyId, { branchId, leadId: lead._id.toString(), opportunityId: opportunity._id.toString(), type: "CALL", notes: "Discovery call", occurredAt: new Date() });
  await createInteraction(sellerId.toString(), companyId, { branchId, leadId: lead._id.toString(), opportunityId: opportunity._id.toString(), type: "EMAIL", subject: "Proposal follow-up", summary: "Sent the product information", occurredAt: new Date() });
  const quote = await createOpportunityQuote(sellerId.toString(), companyId, opportunity._id.toString(), [{ productId: product._id.toString(), quantity: 2 }]);
  assert.equal(quote?.total, 200);
  const convertedLead = await mongoose.model("Lead").findById(lead._id);
  assert.equal(convertedLead?.get("status"), "CONVERTED");
  const linkedOpportunity = await OpportunityModel.findById(opportunity._id);
  assert.equal(linkedOpportunity?.stage, "PROPOSAL");
  assert.equal(linkedOpportunity?.quoteId?.toString(), quote?._id.toString());

  await updateQuoteStatus(companyId, quote!._id.toString(), "send");
  await updateQuoteStatus(companyId, quote!._id.toString(), "accept");
  const order = await createOrderFromQuote(sellerId.toString(), companyId, quote!._id.toString(), warehouse._id.toString());
  await submitSalesOrder(companyId, order!._id.toString());
  await requestSalesApproval(companyId, order!._id.toString());
  await approveSalesOrder(approverId.toString(), companyId, order!._id.toString());
  await startSalesPreparation(companyId, order!._id.toString());
  await readySalesOrder(companyId, order!._id.toString());
  const sale = await deliverSalesOrder(sellerId.toString(), companyId, order!._id.toString());
  assert.ok(sale);
  await setOpportunityStage(companyId, opportunity._id.toString(), "WON");

  const customer = await CustomerModel.findById(convertedLead?.get("customerId"));
  assert.ok(customer);
  const history = await customerHistory(companyId, customer!._id.toString());
  assert.equal(history.contacts.length, 1);
  assert.equal(history.activities.length, 1);
  assert.equal(history.interactions.length, 1);
  assert.equal(history.opportunities.length, 1);
  assert.equal(history.sales.length, 1);
  assert.equal(history.entries.length, 4);
});
