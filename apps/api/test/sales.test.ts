import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { orderSchema, quoteSchema } from "../src/modules/sales/sales.validation.js";

test("sales schemas require valid lines and operational context", () => {
  const valid = {
    branchId: "branch-1",
    customerId: "customer-1",
    warehouseId: "warehouse-1",
    lines: [{ productId: "product-1", quantity: 2 }]
  };

  assert.equal(quoteSchema.safeParse(valid).success, true);
  assert.equal(orderSchema.safeParse({ warehouseId: "warehouse-1", quoteId: "quote-1" }).success, true);
  assert.equal(orderSchema.safeParse(valid).success, false);
});

test("sales routes require authentication", async () => {
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

  for (const path of ["/quotes", "/orders", "/orders/507f1f77bcf86cd799439011/confirm"]) {
    const response = await request(app).post(`/api/v1/companies/507f1f77bcf86cd799439011/sales${path}`).send({});
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
