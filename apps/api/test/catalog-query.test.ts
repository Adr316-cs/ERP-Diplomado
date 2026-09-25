import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogQuerySchema, escapeCatalogSearch, resolveCatalogSort } from "../src/shared/catalog-query.js";

test("catalog query provides bounded pagination defaults", () => {
  assert.deepEqual(catalogQuerySchema.parse({}), { page: 1, pageSize: 25, order: "asc", status: "active" });
  assert.equal(catalogQuerySchema.parse({ page: "3", pageSize: "50", order: "desc" }).page, 3);
});

test("catalog query rejects invalid pagination and status values", () => {
  assert.equal(catalogQuerySchema.safeParse({ page: 0 }).success, false);
  assert.equal(catalogQuerySchema.safeParse({ pageSize: 101 }).success, false);
  assert.equal(catalogQuerySchema.safeParse({ status: "deleted" }).success, false);
});

test("catalog search treats user input as literal text and sort keys stay whitelisted", () => {
  assert.equal(escapeCatalogSearch("A+B.*(x)"), "A\\+B\\.\\*\\(x\\)");
  assert.equal(resolveCatalogSort("unitPrice", ["name", "unitPrice"]), "unitPrice");
  assert.equal(resolveCatalogSort("createdBy.passwordHash", ["name", "unitPrice"]), "name");
});
