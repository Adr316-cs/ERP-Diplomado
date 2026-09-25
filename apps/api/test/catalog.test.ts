import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { categorySchema } from "../src/modules/categories/category.validation.js";
import { customerSchema } from "../src/modules/customers/customer.validation.js";
import { productSchema } from "../src/modules/products/product.validation.js";
import { supplierSchema } from "../src/modules/suppliers/supplier.validation.js";

test("catalog schemas reject invalid business data", () => {
  assert.equal(customerSchema.safeParse({ name: "A" }).success, false);
  assert.equal(supplierSchema.safeParse({ name: "Supplier", email: "invalid" }).success, false);
  assert.equal(categorySchema.safeParse({ name: "Products", code: "bad code" }).success, false);
  assert.equal(productSchema.safeParse({
    categoryId: "category-1",
    sku: "SKU-1",
    name: "Product",
    unitPrice: -1,
    stockMinimum: 0
  }).success, false);
});

test("company-scoped catalog routes require authentication", async () => {
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

  for (const resource of ["customers", "suppliers", "categories", "products"]) {
    const response = await request(app).get(`/api/v1/companies/507f1f77bcf86cd799439011/${resource}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
test("master-data catalog routes require authentication", async () => {
  const app = createApp({
    NODE_ENV: "test", API_PORT: 4000, API_HOST: "localhost", CORS_ORIGIN: "http://localhost:8081", LOG_LEVEL: "silent", MONGODB_URI: "",
    JWT_ACCESS_SECRET: "access-secret-used-only-by-tests-123456", JWT_REFRESH_SECRET: "refresh-secret-used-only-by-tests-123456", JWT_ACCESS_EXPIRES_IN: "15m", JWT_REFRESH_EXPIRES_IN: "7d"
  });
  for (const catalog of ["brands", "units", "taxes", "paymentMethods"]) {
    const response = await request(app).get(`/api/v1/companies/507f1f77bcf86cd799439011/master-data/${catalog}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});

test("product schema preserves legacy pricing and normalizes salePrice", () => {
  const legacy = productSchema.parse({ categoryId: "category-1", sku: "SKU-1", name: "Legacy", unitPrice: 20 });
  assert.equal(legacy.unitPrice, 20);
  assert.equal(legacy.salePrice, 20);
  assert.equal(legacy.cost, 0);
  const current = productSchema.parse({ categoryId: "category-1", sku: "SKU-2", name: "Current", salePrice: 35, cost: 12, brandId: "507f1f77bcf86cd799439011", unitId: "507f1f77bcf86cd799439012", taxId: "507f1f77bcf86cd799439013" });
  assert.equal(current.unitPrice, 35);
  assert.equal(current.salePrice, 35);
  assert.equal(productSchema.safeParse({ categoryId: "category-1", sku: "SKU-3", name: "Mismatch", unitPrice: 20, salePrice: 21 }).success, false);
});
