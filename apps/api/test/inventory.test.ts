import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { calculateNextStock } from "../src/modules/inventory/inventory.service.js";
import { movementSchema } from "../src/modules/inventory/inventory.validation.js";

test("inventory movement rules prevent negative stock", () => {
  assert.equal(calculateNextStock(10, "IN", 5), 15);
  assert.equal(calculateNextStock(10, "RETURN", 5), 15);
  assert.equal(calculateNextStock(10, "OUT", 5), 5);
  assert.equal(calculateNextStock(10, "ADJUSTMENT", 3), 3);
  assert.throws(() => calculateNextStock(2, "OUT", 3), /Existencias insuficientes/);
});

test("transfer movements require a positive quantity and destination", () => {
  assert.equal(movementSchema.safeParse({
    productId: "product-1",
    warehouseId: "warehouse-1",
    destinationWarehouseId: "warehouse-2",
    type: "TRANSFER",
    quantity: 4,
    reason: "Reubicación"
  }).success, true);
  assert.equal(movementSchema.safeParse({
    productId: "product-1",
    warehouseId: "warehouse-1",
    type: "OUT",
    quantity: 0,
    reason: "Salida"
  }).success, false);
});

test("warehouse and inventory routes require authentication", async () => {
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

  for (const resource of ["warehouses", "inventory", "inventory/movements"]) {
    const response = await request(app).get(`/api/v1/companies/507f1f77bcf86cd799439011/${resource}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
