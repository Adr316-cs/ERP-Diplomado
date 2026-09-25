import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { requireInventoryMovementPermission, requirePermission } from "../src/middleware/auth.js";
import type { AuthUser } from "../src/modules/auth/auth.types.js";
import { permissionsForRole } from "../src/modules/auth/authorization.js";

const invokePermission = (user: AuthUser, companyId: string) => {
  let error: unknown;
  const request = { auth: user, companyId, isCompanyOwner: user.memberships.some((membership) => membership.companyId === companyId && membership.isOwner) } as unknown as Request;
  requirePermission("sales.create")(request, {} as Response, (nextError) => { error = nextError; });
  return error;
};

test("permission middleware denies users without the required permission", () => {
  const user: AuthUser = { id: "u1", email: "employee@example.com", name: "Employee", roles: ["EMPLOYEE"], permissions: ["sales.read"], memberships: [{ companyId: "c1", branchIds: [], isOwner: false }] };
  const error = invokePermission(user, "c1") as { statusCode?: number; code?: string };
  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "FORBIDDEN");
});

test("company owners can perform company-scoped operations", () => {
  const user: AuthUser = { id: "u1", email: "owner@example.com", name: "Owner", roles: ["EMPLOYEE"], permissions: [], memberships: [{ companyId: "c1", branchIds: [], isOwner: true }] };
  assert.equal(invokePermission(user, "c1"), undefined);
});

test("company ownership does not grant access to a different company", () => {
  const user: AuthUser = { id: "u1", email: "owner@example.com", name: "Owner", roles: ["EMPLOYEE"], permissions: [], memberships: [{ companyId: "c1", branchIds: [], isOwner: true }] };
  const error = invokePermission(user, "c2") as { statusCode?: number; code?: string };
  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "FORBIDDEN");
});

test("inventory adjustments and transfers require their dedicated permissions", () => {
  const user: AuthUser = { id: "u2", email: "warehouse@example.com", name: "Warehouse", roles: ["WAREHOUSE"], permissions: ["inventory.create"], memberships: [{ companyId: "c1", branchIds: [], isOwner: false }] };
  const invoke = (type: string) => {
    let error: unknown;
    const request = { auth: user, companyId: "c1", body: { type } } as unknown as Request;
    requireInventoryMovementPermission(request, {} as Response, (nextError) => { error = nextError; });
    return error as { code?: string } | undefined;
  };
  assert.equal(invoke("IN")?.code, undefined);
  assert.equal(invoke("ADJUSTMENT")?.code, "FORBIDDEN");
  assert.equal(invoke("TRANSFER")?.code, "FORBIDDEN");
});

test("purchase role submits requests while manager approval stays separate", () => {
  const purchase = permissionsForRole("PURCHASE");
  const manager = permissionsForRole("MANAGER");
  assert.equal(purchase.includes("purchases.update"), true);
  assert.equal(purchase.includes("purchases.approve"), false);
  assert.equal(manager.includes("purchases.approve"), true);
});

test("sales and warehouse roles can update sales workflow while only managers approve", () => {
  const sales = permissionsForRole("SALES");
  const warehouse = permissionsForRole("WAREHOUSE");
  const manager = permissionsForRole("MANAGER");
  assert.equal(sales.includes("sales.update"), true);
  assert.equal(warehouse.includes("sales.update"), true);
  assert.equal(sales.includes("sales.approve"), false);
  assert.equal(manager.includes("sales.approve"), true);
});

test("compensation data is limited to HR and administrator roles", () => {
  assert.equal(permissionsForRole("HR").includes("hr.compensation.read"), true);
  assert.equal(permissionsForRole("ADMIN").includes("hr.compensation.read"), true);
  assert.equal(permissionsForRole("MANAGER").includes("hr.compensation.read"), false);
  assert.equal(permissionsForRole("FINANCE").includes("hr.compensation.read"), false);
});


