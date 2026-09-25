import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryParentWouldCycle } from "../src/shared/category-tree.js";

test("category parent validation detects self-reference and existing loops", () => {
  assert.equal(categoryParentWouldCycle("a", ["b", "a"]), true);
  assert.equal(categoryParentWouldCycle("a", ["b", "c", "b"]), true);
  assert.equal(categoryParentWouldCycle("a", ["b", "c"]), false);
});
