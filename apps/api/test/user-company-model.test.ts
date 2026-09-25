import assert from "node:assert/strict";
import { test } from "node:test";
import { UserCompanyModel } from "../src/modules/auth/auth.model.js";

test("UserCompany stores tenant membership and enforces one membership per user/company", () => {
  assert.equal(UserCompanyModel.schema.path("userId").options.required, true);
  assert.equal(UserCompanyModel.schema.path("companyId").options.required, true);
  assert.equal(UserCompanyModel.schema.path("isOwner").options.default, false);
  assert.ok(UserCompanyModel.schema.path("branchIds"));
  assert.ok(UserCompanyModel.schema.path("assignedBy"));
  const uniqueMembershipIndex = UserCompanyModel.schema.indexes().find(([keys, options]) =>
    (keys as Record<string, number>).userId === 1 && (keys as Record<string, number>).companyId === 1 && (options as { unique?: boolean }).unique === true
  );
  assert.ok(uniqueMembershipIndex);
});
