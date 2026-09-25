import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePurchaseAmounts } from "../src/modules/purchases/purchase-pricing.js";

test("purchase prices calculate exclusive tax without including it in subtotal", () => {
  assert.deepEqual(calculatePurchaseAmounts(100, 2, { rate: 16, isInclusive: false }), {
    subtotal: 200,
    taxAmount: 32,
    total: 232
  });
});

test("purchase prices extract inclusive tax without double charging it", () => {
  assert.deepEqual(calculatePurchaseAmounts(116, 2, { rate: 16, isInclusive: true }), {
    subtotal: 200,
    taxAmount: 32,
    total: 232
  });
});

test("inclusive purchase rounding keeps subtotal plus tax equal to the charged total", () => {
  const amounts = calculatePurchaseAmounts(0.03, 1, { rate: 20, isInclusive: true });
  assert.equal(amounts.subtotal + amounts.taxAmount, amounts.total);
  assert.equal(amounts.total, 0.03);
});
