import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { HttpError } from "../../middleware/errors.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { addTicketAttachment, addTicketComment, assignTicket, changeTicketStatus, createCategory, createTicket, listCategories, listSlaPolicies, listTicketHistory, listTickets, upsertSlaPolicy } from "./helpdesk.service.js";
import { assignmentSchema, attachmentSchema, categorySchema, commentSchema, slaPolicySchema, ticketSchema, ticketStatusSchema } from "./helpdesk.validation.js";

const ticketId = (value: string | string[] | undefined) => { if (!value || Array.isArray(value)) throw new HttpError(400, "INVALID_TICKET_ID", "Ticket invalido"); return value; };
export const createHelpdeskRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.post("/categories", requirePermission("helpdesk.create"), asyncHandler(async (req, res) => { const data = await createCategory(req.auth!.id, req.companyId!, categorySchema.parse(req.body).name); res.status(201).json({ success: true, data, message: "Categoria creada" }); }));
  router.get("/categories", requirePermission("helpdesk.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listCategories(req.companyId!), message: "Categorias obtenidas" }); }));
  router.put("/sla", requirePermission("helpdesk.update"), asyncHandler(async (req, res) => { const data = await upsertSlaPolicy(req.auth!.id, req.companyId!, slaPolicySchema.parse(req.body)); res.json({ success: true, data, message: "Politica SLA actualizada" }); }));
  router.get("/sla", requirePermission("helpdesk.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listSlaPolicies(req.companyId!), message: "Politicas SLA obtenidas" }); }));
  router.post("/tickets", requirePermission("helpdesk.create"), asyncHandler(async (req, res) => { const data = await createTicket(req.auth!.id, req.companyId!, { ...ticketSchema.parse(req.body), branchId: req.branchId ?? req.body.branchId }); res.status(201).json({ success: true, data, message: "Ticket creado" }); }));
  router.get("/tickets", requirePermission("helpdesk.read"), asyncHandler(async (req, res) => { const data = await listTickets(req.companyId!, branchFilterFor(req)); res.json({ success: true, data, message: "Tickets obtenidos" }); }));
  router.post("/tickets/:ticketId/comments", requirePermission("helpdesk.create"), asyncHandler(async (req, res) => { const data = await addTicketComment(req.auth!.id, req.companyId!, ticketId(req.params.ticketId), commentSchema.parse(req.body).message, branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Comentario agregado" }); }));
  router.patch("/tickets/:ticketId/status", requirePermission("helpdesk.update"), asyncHandler(async (req, res) => { const data = await changeTicketStatus(req.auth!.id, req.companyId!, ticketId(req.params.ticketId), ticketStatusSchema.parse(req.body).status, branchFilterFor(req)); res.json({ success: true, data, message: "Estado actualizado" }); }));
  router.patch("/tickets/:ticketId/assignment", requirePermission("helpdesk.update"), asyncHandler(async (req, res) => { const data = await assignTicket(req.auth!.id, req.companyId!, ticketId(req.params.ticketId), assignmentSchema.parse(req.body).assignedTo, branchFilterFor(req)); res.json({ success: true, data, message: "Asignacion actualizada" }); }));
  router.post("/tickets/:ticketId/attachments", requirePermission("helpdesk.create"), asyncHandler(async (req, res) => { const data = await addTicketAttachment(req.auth!.id, req.companyId!, ticketId(req.params.ticketId), attachmentSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Metadata del archivo agregada" }); }));
  router.get("/tickets/:ticketId/history", requirePermission("helpdesk.read"), asyncHandler(async (req, res) => { const data = await listTicketHistory(req.companyId!, ticketId(req.params.ticketId), branchFilterFor(req)); res.json({ success: true, data, message: "Historial obtenido" }); }));
  return router;
};
