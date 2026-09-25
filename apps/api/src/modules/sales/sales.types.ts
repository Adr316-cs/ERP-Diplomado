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

export type SalesOrderStatus = "DRAFT" | "SUBMITTED" | "PENDING_APPROVAL" | "APPROVED" | "PREPARING" | "READY_FOR_DELIVERY" | "DELIVERED" | "REJECTED" | "CANCELLED";
