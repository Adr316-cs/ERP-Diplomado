import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { HttpError } from "../../middleware/errors.js";
import { approveSalesOrder, createOrderFromQuote, deliverSalesOrder, listOrders, listQuotes, listSales, readySalesOrder, rejectSalesOrder, requestSalesApproval, startSalesPreparation, submitSalesOrder, updateQuoteStatus, registerQuote } from "./sales.service.js";
import { orderSchema, quoteSchema } from "./sales.validation.js";

export const createSalesRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/quotes", requirePermission("sales.create"), asyncHandler(async (request, response) => {
    const quote = await registerQuote(request.auth!.id, request.companyId!, quoteSchema.parse({ ...request.body, branchId: request.body?.branchId ?? request.branchId }));
    response.status(201).json({ success: true, data: quote, message: "Cotización creada" });
  }));

  router.get("/quotes", requirePermission("sales.read"), asyncHandler(async (request, response) => {
    const quotes = await listQuotes(request.companyId!, branchFilterFor(request));
    response.status(200).json({ success: true, data: quotes, message: "Cotizaciones obtenidas" });
  }));

  for (const action of ["send", "accept", "reject"] as const) {
    router.post(`/quotes/:quoteId/${action}`, requirePermission("sales.update"), asyncHandler(async (request, response) => {
      const id = request.params.quoteId;
      if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_QUOTE_ID", "Cotizacion invalida");
      const quote = await updateQuoteStatus(request.companyId!, id, action, branchFilterFor(request));
      response.json({ success: true, data: quote, message: "Estado de cotizacion actualizado" });
    }));
  }

  router.post("/orders", requirePermission("sales.create"), asyncHandler(async (request, response) => {
    const input = orderSchema.parse(request.body);
    const order = await createOrderFromQuote(request.auth!.id, request.companyId!, input.quoteId, input.warehouseId, branchFilterFor(request));
    response.status(201).json({ success: true, data: order, message: "Pedido creado" });
  }));

  router.get("/orders", requirePermission("sales.read"), asyncHandler(async (request, response) => {
    const orders = await listOrders(request.companyId!, branchFilterFor(request));
    response.status(200).json({ success: true, data: orders, message: "Pedidos obtenidos" });
  }));

  router.get("/invoices", requirePermission("sales.read"), asyncHandler(async (request, response) => {
    const sales = await listSales(request.companyId!, branchFilterFor(request));
    response.status(200).json({ success: true, data: sales, message: "Facturas obtenidas" });
  }));

  router.post("/orders/:orderId/submit", requirePermission("sales.update"), asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido inválido");
    const order = await submitSalesOrder(request.companyId!, orderId, branchFilterFor(request));
    response.json({ success: true, data: order, message: "Pedido enviado" });
  }));

  router.post("/orders/:orderId/request-approval", requirePermission("sales.update"), asyncHandler(async (request, response) => {
    const id = request.params.orderId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido invalido");
    response.json({ success: true, data: await requestSalesApproval(request.companyId!, id, branchFilterFor(request)), message: "Aprobacion solicitada" });
  }));
  router.post("/orders/:orderId/approve", requirePermission("sales.approve"), asyncHandler(async (request, response) => {
    const id = request.params.orderId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido invalido");
    response.json({ success: true, data: await approveSalesOrder(request.auth!.id, request.companyId!, id, branchFilterFor(request)), message: "Pedido aprobado" });
  }));
  router.post("/orders/:orderId/reject", requirePermission("sales.approve"), asyncHandler(async (request, response) => {
    const id = request.params.orderId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido invalido");
    const reason = typeof request.body?.reason === "string" ? request.body.reason.trim() : "";
    if (reason.length < 3 || reason.length > 300) throw new HttpError(400, "INVALID_REJECTION_REASON", "Indica un motivo de 3 a 300 caracteres");
    response.json({ success: true, data: await rejectSalesOrder(request.companyId!, id, reason, branchFilterFor(request)), message: "Pedido rechazado" });
  }));
  router.post("/orders/:orderId/prepare", requirePermission("sales.update"), asyncHandler(async (request, response) => {
    const id = request.params.orderId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido invalido");
    response.json({ success: true, data: await startSalesPreparation(request.companyId!, id, branchFilterFor(request)), message: "Preparacion iniciada" });
  }));
  router.post("/orders/:orderId/ready", requirePermission("sales.update"), asyncHandler(async (request, response) => {
    const id = request.params.orderId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido invalido");
    response.json({ success: true, data: await readySalesOrder(request.companyId!, id, branchFilterFor(request)), message: "Pedido listo para entrega" });
  }));
  router.post("/orders/:orderId/deliver", requirePermission("sales.update"), asyncHandler(async (request, response) => {
    const id = request.params.orderId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido invalido");
    response.status(201).json({ success: true, data: await deliverSalesOrder(request.auth!.id, request.companyId!, id, branchFilterFor(request)), message: "Entrega registrada y factura generada" });
  }));

  return router;
};


