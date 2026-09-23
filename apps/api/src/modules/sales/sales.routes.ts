import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { HttpError } from "../../middleware/errors.js";
import { confirmOrder, listOrders, listQuotes, registerOrder, registerQuote } from "./sales.service.js";
import { orderSchema, quoteSchema } from "./sales.validation.js";

export const createSalesRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/quotes", asyncHandler(async (request, response) => {
    const quote = await registerQuote(request.auth!.id, request.companyId!, quoteSchema.parse(request.body));
    response.status(201).json({ success: true, data: quote, message: "Cotización creada" });
  }));

  router.get("/quotes", asyncHandler(async (request, response) => {
    const quotes = await listQuotes(request.companyId!);
    response.status(200).json({ success: true, data: quotes, message: "Cotizaciones obtenidas" });
  }));

  router.post("/orders", asyncHandler(async (request, response) => {
    const order = await registerOrder(request.auth!.id, request.companyId!, orderSchema.parse(request.body));
    response.status(201).json({ success: true, data: order, message: "Pedido creado" });
  }));

  router.get("/orders", asyncHandler(async (request, response) => {
    const orders = await listOrders(request.companyId!);
    response.status(200).json({ success: true, data: orders, message: "Pedidos obtenidos" });
  }));

  router.post("/orders/:orderId/confirm", asyncHandler(async (request, response) => {
    const orderId = request.params.orderId;
    if (!orderId || Array.isArray(orderId)) throw new HttpError(400, "INVALID_ORDER_ID", "Pedido inválido");
    const sale = await confirmOrder(request.auth!.id, request.companyId!, orderId);
    response.status(201).json({ success: true, data: sale, message: "Pedido confirmado y venta registrada" });
  }));

  return router;
};