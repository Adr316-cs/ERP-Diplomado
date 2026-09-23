export type SalesLineInput = {
  productId: string;
  quantity: number;
  unitPrice?: number | undefined;
};

export type SalesLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
};