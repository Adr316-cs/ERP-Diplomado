import assert from "node:assert/strict";
import { test } from "node:test";
import { customerUpdateSchema } from "../src/modules/customers/customer.validation.js";
import { supplierUpdateSchema } from "../src/modules/suppliers/supplier.validation.js";
import { productUpdateSchema } from "../src/modules/products/product.validation.js";
import { categoryUpdateSchema } from "../src/modules/categories/category.validation.js";
import { warehouseUpdateSchema } from "../src/modules/warehouses/warehouse.validation.js";

test("catalog updates require at least one valid field", () => {
  for (const schema of [customerUpdateSchema, supplierUpdateSchema, productUpdateSchema, categoryUpdateSchema, warehouseUpdateSchema]) {
    assert.equal(schema.safeParse({}).success, false);
  }
  assert.equal(customerUpdateSchema.safeParse({ name: "Updated customer" }).success, true);
  assert.equal(productUpdateSchema.safeParse({ unitPrice: 10 }).success, true);
  assert.equal(warehouseUpdateSchema.safeParse({ name: "Updated warehouse" }).success, true);
});
