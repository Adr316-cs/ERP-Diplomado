import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { purchaseOrderSchema } from "../src/modules/purchases/purchases.validation.js";

test("purchase order schema requires supplier, warehouse and positive lines", () => {
  const valid = {
    branchId: "branch-1",
    warehouseId: "warehouse-1",
    supplierId: "supplier-1",
    lines: [{ productId: "product-1", quantity: 3, unitCost: 12.5 }]
  };

  assert.equal(purchaseOrderSchema.safeParse(valid).success, true);
  assert.equal(purchaseOrderSchema.safeParse({ ...valid, lines: [{ ...valid.lines[0], quantity: 0 }] }).success, false);
  assert.equal(purchaseOrderSchema.safeParse({ ...valid, supplierId: "" }).success, false);
});

test("purchase routes require authentication", async () => {
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

  for (const path of ["/orders", "/orders/507f1f77bcf86cd799439011/approve", "/orders/507f1f77bcf86cd799439011/receive"]) {
    const response = await request(app).post(`/api/v1/companies/507f1f77bcf86cd799439011/purchases${path}`).send({});
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});