import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { approvePurchaseOrder, approvePurchaseRequest, cancelPurchaseOrder, cancelPurchaseRequest, createPurchaseQuotation, createPurchaseRequest, listPurchaseOrders, listPurchaseQuotations, listPurchaseRequests, receivePurchaseOrder, rejectPurchaseOrder, rejectPurchaseRequest, requestPurchaseApproval, requestPurchaseRequestApproval, selectPurchaseQuotation, submitPurchaseOrder, submitPurchaseRequest } from "./purchases.service.js";
import { purchaseQuotationSchema, purchaseRejectionSchema, purchaseRequestSchema } from "./purchases.validation.js";

export const createPurchasesRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/requests", requirePermission("purchases.create"), asyncHandler(async (request, response) => {
    const input = purchaseRequestSchema.parse({ ...request.body, branchId: request.body?.branchId ?? request.branchId });
    const purchaseRequest = await createPurchaseRequest(request.auth!.id, request.companyId!, input);
    response.status(201).json({ success: true, data: purchaseRequest, message: "Solicitud de compra creada" });
  }));
  router.get("/requests", requirePermission("purchases.read"), asyncHandler(async (request, response) => {
    const purchaseRequests = await listPurchaseRequests(request.companyId!, branchFilterFor(request));
    response.json({ success: true, data: purchaseRequests, message: "Solicitudes de compra obtenidas" });
  }));
  router.post("/requests/:requestId/submit", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const id = request.params.requestId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra inválida");
    response.json({ success: true, data: await submitPurchaseRequest(request.companyId!, id), message: "Solicitud enviada" });
  }));
  router.post("/requests/:requestId/request-approval", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const id = request.params.requestId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra inválida");
    response.json({ success: true, data: await requestPurchaseRequestApproval(request.companyId!, id), message: "Aprobación solicitada" });
  }));
  router.post("/requests/:requestId/approve", requirePermission("purchases.approve"), asyncHandler(async (request, response) => {
    const id = request.params.requestId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra inválida");
    response.json({ success: true, data: await approvePurchaseRequest(request.auth!.id, request.companyId!, id), message: "Solicitud aprobada" });
  }));
  router.post("/requests/:requestId/reject", requirePermission("purchases.approve"), asyncHandler(async (request, response) => {
    const id = request.params.requestId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra inválida");
    const { reason } = purchaseRejectionSchema.parse(request.body);
    response.json({ success: true, data: await rejectPurchaseRequest(request.auth!.id, request.companyId!, id, reason), message: "Solicitud rechazada" });
  }));
  router.post("/requests/:requestId/cancel", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const id = request.params.requestId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra inválida");
    response.json({ success: true, data: await cancelPurchaseRequest(request.companyId!, id), message: "Solicitud cancelada" });
  }));
  router.get("/requests/:requestId/quotations", requirePermission("purchases.read"), asyncHandler(async (request, response) => {
    const id = request.params.requestId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra inválida");
    response.json({ success: true, data: await listPurchaseQuotations(request.companyId!, id), message: "Cotizaciones obtenidas" });
  }));
  router.post("/quotations", requirePermission("purchases.create"), asyncHandler(async (request, response) => {
    const quotation = await createPurchaseQuotation(request.auth!.id, request.companyId!, purchaseQuotationSchema.parse(request.body));
    response.status(201).json({ success: true, data: quotation, message: "Cotización registrada" });
  }));
  router.post("/quotations/:quotationId/select", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const id = request.params.quotationId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_PURCHASE_QUOTATION_ID", "Cotización inválida");
    response.status(201).json({ success: true, data: await selectPurchaseQuotation(request.auth!.id, request.companyId!, id), message: "Cotización convertida en orden" });
  }));
  router.get("/orders", requirePermission("purchases.read"), asyncHandler(async (request, response) => {
    const orders = await listPurchaseOrders(request.companyId!, branchFilterFor(request));
    response.status(200).json({ success: true, data: orders, message: "Órdenes de compra obtenidas" });
  }));
  router.post("/orders/:orderId/submit", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra invÃ¡lida");
    response.json({ success: true, data: await submitPurchaseOrder(request.companyId!, orderId), message: "Orden enviada" });
  }));
  router.post("/orders/:orderId/request-approval", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra invÃ¡lida");
    response.json({ success: true, data: await requestPurchaseApproval(request.companyId!, orderId), message: "AprobaciÃ³n solicitada" });
  }));
  router.post("/orders/:orderId/approve", requirePermission("purchases.approve"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra inválida");
    const order = await approvePurchaseOrder(request.auth!.id, request.companyId!, orderId);
    response.status(200).json({ success: true, data: order, message: "Orden de compra aprobada" });
  }));
  router.post("/orders/:orderId/reject", requirePermission("purchases.approve"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra invÃ¡lida");
    const { reason } = purchaseRejectionSchema.parse(request.body);
    response.json({ success: true, data: await rejectPurchaseOrder(request.auth!.id, request.companyId!, orderId, reason), message: "Orden rechazada" });
  }));
  router.post("/orders/:orderId/cancel", requirePermission("purchases.update"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra invÃ¡lida");
    response.json({ success: true, data: await cancelPurchaseOrder(request.companyId!, orderId), message: "Orden cancelada" });
  }));
  router.post("/orders/:orderId/receive", requirePermission("purchases.receive"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_PURCHASE_ORDER_ID", "Orden de compra inválida");
    const order = await receivePurchaseOrder(request.auth!.id, request.companyId!, orderId);
    response.status(200).json({ success: true, data: order, message: "Recepción registrada" });
  }));
  return router;
};
