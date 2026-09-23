export type PurchaseLineInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export type PurchaseLine = PurchaseLineInput & { total: number };