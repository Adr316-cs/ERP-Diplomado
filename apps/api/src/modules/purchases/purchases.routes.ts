import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { approvePurchaseOrder, listPurchaseOrders, receivePurchaseOrder, registerPurchaseOrder } from "./purchases.service.js";
import { purchaseOrderSchema } from "./purchases.validation.js";

export const createPurchasesRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/orders", asyncHandler(async (request, response) => {
    const order = await registerPurchaseOrder(request.auth!.id, request.companyId!, purchaseOrderSchema.parse(request.body));
    response.status(201).json({ success: true, data: order, message: "Orden de compra creada" });
  }));

  router.get("/orders", asyncHandler(async (request, response) => {
    const orders = await listPurchaseOrders(request.companyId!);
    response.status(200).json({ success: true, data: orders, message: "Órdenes de compra obtenidas" });
  }));

  router.post("/orders/:orderId/approve", asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra inválida");
    const order = await approvePurchaseOrder(request.auth!.id, request.companyId!, orderId);
    response.status(200).json({ success: true, data: order, message: "Orden de compra aprobada" });
  }));

  router.post("/orders/:orderId/receive", asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra inválida");
    const order = await receivePurchaseOrder(request.auth!.id, request.companyId!, orderId);
    response.status(200).json({ success: true, data: order, message: "Recepción registrada" });
  }));

  return router;
};