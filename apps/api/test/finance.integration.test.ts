import assert from "node:assert/strict";
import { test } from "node:test";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { AccountModel, FinanceTransactionModel } from "../src/modules/finance/finance.model.js";
import { createAccount, createBudget, listBudgets, recordTransaction } from "../src/modules/finance/finance.service.js";

test("replica set records finance movements and calculates company budgets", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => {
    await disconnectDatabase();
    await replicaSet.stop();
  });
  await connectDatabase(replicaSet.getUri());

  const userId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "Finance Integration Co", createdBy: userId });
  const companyId = company._id.toString();
  const account = await createAccount(userId.toString(), companyId, { name: "Operating Bank", code: "OPERATING", type: "BANK", currency: "MXN" });
  await recordTransaction(userId.toString(), companyId, { accountId: account._id.toString(), type: "INCOME", amount: 1000, description: "Service income" });
  await recordTransaction(userId.toString(), companyId, { accountId: account._id.toString(), type: "EXPENSE", amount: 125, description: "Office supplies" });

  const year = new Date().getUTCFullYear();
  const periodStart = new Date(Date.UTC(year, 0, 1));
  const periodEnd = new Date(Date.UTC(year, 11, 31));
  await createBudget(userId.toString(), companyId, { code: "OPS-EXP", name: "Operating expenses", type: "EXPENSE", periodStart, periodEnd, amount: 200 });
  await createBudget(userId.toString(), companyId, { code: "OPS-INC", name: "Operating income", type: "INCOME", periodStart, periodEnd, amount: 1500 });

  const budgets = await listBudgets(companyId);
  const expenseBudget = budgets.find((budget) => budget.code === "OPS-EXP");
  const incomeBudget = budgets.find((budget) => budget.code === "OPS-INC");
  assert.equal(expenseBudget?.actualAmount, 125);
  assert.equal(expenseBudget?.remainingAmount, 75);
  assert.equal(incomeBudget?.actualAmount, 1000);
  assert.equal(incomeBudget?.remainingAmount, 500);
  assert.equal(await FinanceTransactionModel.countDocuments({ companyId }), 2);
  assert.equal(await AccountModel.findById(account._id).then((value) => value?.balance), 875);
});
