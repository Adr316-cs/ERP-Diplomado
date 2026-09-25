import assert from "node:assert/strict";
import { test } from "node:test";
import { BrandModel, PaymentMethodModel, TaxModel, UnitModel } from "../src/modules/master-data/master-data.model.js";
import { brandSchema, paymentMethodSchema, taxSchema, unitSchema } from "../src/modules/master-data/master-data.validation.js";
import { availablePermissions } from "../src/modules/auth/authorization.js";

test("master catalog schemas enforce identifiers and business bounds", () => {
  assert.equal(brandSchema.safeParse({ name: "AC", code: "ac" }).success, true);
  assert.equal(unitSchema.safeParse({ name: "Piece", symbol: "ea", decimalPlaces: 7 }).success, false);
  assert.equal(taxSchema.safeParse({ name: "VAT", code: "VAT", rate: 101 }).success, false);
  assert.equal(paymentMethodSchema.safeParse({ name: "Card", code: "CARD", kind: "CRYPTO" }).success, false);
});

test("master models enforce a company-scoped unique business key", () => {
  const cases = [[BrandModel, "code"], [UnitModel, "symbol"], [TaxModel, "code"], [PaymentMethodModel, "code"]] as const;
  for (const [model, field] of cases) {
    assert.equal(model.schema.path("companyId").options.required, true);
    assert.equal(model.schema.path("createdBy").options.required, true);
    assert.ok(model.schema.indexes().some(([keys, options]) =>
      (keys as Record<string, number>).companyId === 1 && (keys as Record<string, number>)[field] === 1 && (options as { unique?: boolean }).unique === true
    ));
  }
});

test("master catalogs have granular permissions", () => {
  for (const permission of ["brands.read", "units.create", "taxes.update", "paymentMethods.delete"]) assert.ok(availablePermissions.includes(permission));
});
