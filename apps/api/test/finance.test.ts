import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { accountSchema, paymentSchema, transactionSchema } from "../src/modules/finance/finance.validation.js";

test("finance schemas validate account, transaction and payment context", () => {
  assert.equal(accountSchema.safeParse({ name: "Caja", code: "cash", type: "CASH" }).success, true);
  assert.equal(transactionSchema.safeParse({ accountId: "account-1", type: "INCOME", amount: 10, description: "Venta" }).success, true);
  assert.equal(paymentSchema.safeParse({ accountId: "account-1", type: "CUSTOMER", amount: 10 }).success, false);
  assert.equal(paymentSchema.safeParse({ accountId: "account-1", type: "CUSTOMER", amount: 10, saleId: "sale-1" }).success, true);
  assert.equal(paymentSchema.safeParse({ accountId: "account-1", type: "SUPPLIER", amount: 10, purchaseOrderId: "order-1" }).success, true);
});

test("finance routes require authentication", async () => {
  const app = createApp({
    NODE_ENV: "test",
    API_PORT: 4000,
    API_HOST: "localhost",
    CORS_ORIGIN: "http://localhost:8081",
    LOG_LEVEL: "silent",
    MONGODB_URI: "",
    JWT_ACCESS_SECRET: "access-secret-used-only-by-tests-123456",
    JWT_REFRESH_SECRET: "refresh-secret-used-only-by-tests-123456",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d"
  });

  for (const path of ["/accounts", "/transactions", "/payments"]) {
    const response = await request(app).post(`/api/v1/companies/507f1f77bcf86cd799439011/finance${path}`).send({});
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});