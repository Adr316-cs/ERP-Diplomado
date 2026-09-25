import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { branchFilterFor, requireCompanyContext } from "../src/middleware/tenant.js";
import type { AuthUser } from "../src/modules/auth/auth.types.js";

const companyId = "507f1f77bcf86cd799439011";
const branchA = "507f1f77bcf86cd799439012";
const branchB = "507f1f77bcf86cd799439013";
const member: AuthUser = {
  id: "507f1f77bcf86cd799439014",
  email: "branch@example.com",
  name: "Branch User",
  roles: ["EMPLOYEE"],
  permissions: [],
  memberships: [{ companyId, branchIds: [branchA], isOwner: false, roles: ["WAREHOUSE"], permissions: ["inventory.read"] }]
};

const contextRequest = (options: { headerBranch?: string; bodyBranch?: string; queryBranch?: string; user?: AuthUser } = {}) => ({
  params: { companyId },
  query: options.queryBranch ? { branchId: options.queryBranch } : {},
  body: options.bodyBranch ? { branchId: options.bodyBranch } : {},
  auth: options.user ?? member,
  header: (name: string) => name === "x-branch-id" ? options.headerBranch : undefined
}) as unknown as Request;

const resolveContext = (request: Request) => {
  let error: unknown;
  requireCompanyContext(request, {} as Response, (nextError) => { error = nextError; });
  return error as { code?: string; statusCode?: number } | undefined;
};

test("company context exposes only the selected authorized branch", () => {
  const request = contextRequest({ headerBranch: branchA });
  assert.equal(resolveContext(request), undefined);
  assert.equal(request.companyId, companyId);
  assert.equal(request.branchId, branchA);
  assert.deepEqual(request.branchIds, [branchA]);
  assert.deepEqual(request.roles, ["WAREHOUSE"]);
  assert.deepEqual(request.permissions, ["inventory.read"]);
});

test("company context rejects a branch outside the user's membership", () => {
  const error = resolveContext(contextRequest({ headerBranch: branchB }));
  assert.equal(error?.statusCode, 403);
  assert.equal(error?.code, "BRANCH_ACCESS_DENIED");
});

test("company context rejects conflicting branch selectors", () => {
  const error = resolveContext(contextRequest({ headerBranch: branchA, bodyBranch: branchB }));
  assert.equal(error?.statusCode, 400);
  assert.equal(error?.code, "BRANCH_CONTEXT_MISMATCH");
});

test("branch filters include only assigned branches and shared records for non-owners", () => {
  const request = contextRequest();
  assert.equal(resolveContext(request), undefined);
  const filter = branchFilterFor(request) as { $or: Array<Record<string, unknown>> };
  const inFilter = filter.$or[0].branchId as { $in: Array<{ toString(): string }> };
  assert.deepEqual(inFilter.$in.map((id) => id.toString()), [branchA]);
  assert.deepEqual(filter.$or[1], { branchId: { $exists: false } });
});





