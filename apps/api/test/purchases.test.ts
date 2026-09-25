import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { purchaseQuotationSchema, purchaseRejectionSchema, purchaseRequestSchema } from "../src/modules/purchases/purchases.validation.js";
import { PurchaseOrderModel } from "../src/modules/purchases/purchases.model.js";
import { PurchaseRequestModel } from "../src/modules/purchases/purchase-request.model.js";
import { PurchaseQuotationModel } from "../src/modules/purchases/purchase-quotation.model.js";

test("purchase request and quotation schemas validate supplier sourcing inputs", () => {
  const valid = {
    branchId: "branch-1",
    warehouseId: "warehouse-1",
    reason: "Reposición de inventario",
    lines: [{ productId: "product-1", quantity: 3 }]
  };
  assert.equal(purchaseRequestSchema.safeParse(valid).success, true);
  assert.equal(purchaseRequestSchema.safeParse({ ...valid, lines: [{ ...valid.lines[0], quantity: 0 }] }).success, false);
  assert.equal(purchaseRequestSchema.safeParse({ ...valid, reason: "" }).success, false);
  assert.equal(purchaseQuotationSchema.safeParse({ purchaseRequestId: "request-1", supplierId: "supplier-1", lines: [{ productId: "product-1", quantity: 3, unitCost: 12.5 }] }).success, true);
  assert.equal(purchaseQuotationSchema.safeParse({ purchaseRequestId: "request-1", supplierId: "supplier-1", lines: [{ productId: "product-1", quantity: 3, unitCost: -1 }] }).success, false);
  const requestIndexes = PurchaseRequestModel.schema.indexes();
  assert.equal(requestIndexes.some(([keys]) => keys.companyId === 1 && keys.branchId === 1 && keys.status === 1), true);
  const quotationIndexes = PurchaseQuotationModel.schema.indexes();
  assert.equal(quotationIndexes.some(([keys, options]) => keys.companyId === 1 && keys.purchaseRequestId === 1 && keys.supplierId === 1 && options.unique === true), true);
});

test("purchase approval requires a valid rejection reason and supports the ordered workflow states", () => {
  assert.equal(purchaseRejectionSchema.safeParse({ reason: "Precio incorrecto" }).success, true);
  assert.equal(purchaseRejectionSchema.safeParse({ reason: "no" }).success, false);
  const states = PurchaseOrderModel.schema.path("status").options.enum as string[];
  assert.deepEqual(states, ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "RECEIVED", "CANCELLED"]);
  assert.deepEqual(PurchaseRequestModel.schema.path("status").options.enum, ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "CONVERTED", "CANCELLED"]);
  assert.deepEqual(PurchaseQuotationModel.schema.path("status").options.enum, ["OPEN", "SELECTED", "REJECTED"]);
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

  for (const path of ["/requests", "/quotations", "/requests/507f1f77bcf86cd799439011/submit", "/requests/507f1f77bcf86cd799439011/request-approval", "/requests/507f1f77bcf86cd799439011/approve", "/requests/507f1f77bcf86cd799439011/reject", "/requests/507f1f77bcf86cd799439011/cancel", "/requests/507f1f77bcf86cd799439011/quotations", "/quotations/507f1f77bcf86cd799439011/select", "/orders/507f1f77bcf86cd799439011/submit", "/orders/507f1f77bcf86cd799439011/request-approval", "/orders/507f1f77bcf86cd799439011/approve", "/orders/507f1f77bcf86cd799439011/reject", "/orders/507f1f77bcf86cd799439011/cancel", "/orders/507f1f77bcf86cd799439011/receive"]) {
    const response = await request(app).post(`/api/v1/companies/507f1f77bcf86cd799439011/purchases${path}`).send({});
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
