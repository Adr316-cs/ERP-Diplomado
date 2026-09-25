export type PurchaseTax = { rate: number; isInclusive: boolean };
export type PurchaseAmounts = { subtotal: number; taxAmount: number; total: number };

const money = (value: number) => Number(value.toFixed(2));

export const calculatePurchaseAmounts = (unitCost: number, quantity: number, tax?: PurchaseTax): PurchaseAmounts => {
  const rawSubtotal = unitCost * quantity;
  if (!tax || tax.rate === 0) return { subtotal: money(rawSubtotal), taxAmount: 0, total: money(rawSubtotal) };
  const factor = 1 + tax.rate / 100;
  const grossTotal = money(rawSubtotal);
  const taxAmount = tax.isInclusive ? money(rawSubtotal - rawSubtotal / factor) : money(rawSubtotal * tax.rate / 100);
  const subtotal = tax.isInclusive ? money(grossTotal - taxAmount) : money(rawSubtotal);
  return {
    subtotal: money(subtotal),
    taxAmount,
    total: tax.isInclusive ? grossTotal : money(subtotal + taxAmount)
  };
};
