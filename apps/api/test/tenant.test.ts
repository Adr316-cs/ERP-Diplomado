import assert from "node:assert/strict";
import { test } from "node:test";
import { findMembership } from "../src/middleware/tenant.js";

const memberships = [
  { companyId: "company-a", branchIds: ["branch-a"], isOwner: true },
  { companyId: "company-b", branchIds: ["branch-b"], isOwner: false }
];

test("company membership selects only the requested tenant", () => {
  assert.deepEqual(findMembership(memberships, "company-a"), memberships[0]);
  assert.deepEqual(findMembership(memberships, "company-b"), memberships[1]);
  assert.equal(findMembership(memberships, "company-c"), undefined);
});

test("membership ownership remains scoped to its company", () => {
  const membership = findMembership(memberships, "company-b");

  assert.equal(membership?.isOwner, false);
  assert.notEqual(membership?.isOwner, findMembership(memberships, "company-a")?.isOwner);
});