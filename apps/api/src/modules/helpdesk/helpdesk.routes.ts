import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { addTicketComment, createTicket, listTickets } from "./helpdesk.service.js";
import { commentSchema, ticketSchema } from "./helpdesk.validation.js";

export const createHelpdeskRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.post("/tickets", asyncHandler(async (req, res) => { const item = await createTicket(req.auth!.id, req.companyId!, ticketSchema.parse(req.body)); res.status(201).json({ success: true, data: item, message: "Ticket creado" }); }));
  router.get("/tickets", asyncHandler(async (req, res) => { const items = await listTickets(req.companyId!); res.json({ success: true, data: items, message: "Tickets obtenidos" }); }));
  router.post("/tickets/:ticketId/comments", asyncHandler(async (req, res) => { const ticketId = req.params.ticketId; if (!ticketId || Array.isArray(ticketId)) throw new HttpError(400, "INVALID_TICKET_ID", "Ticket inválido"); const item = await addTicketComment(req.auth!.id, req.companyId!, ticketId, commentSchema.parse(req.body).message); res.status(201).json({ success: true, data: item, message: "Comentario añadido" }); }));
  return router;
};