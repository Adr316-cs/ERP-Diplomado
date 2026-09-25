import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { HttpError } from "../../middleware/errors.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { activitySchema, contactSchema, interactionSchema, leadSchema, opportunityQuoteSchema, opportunitySchema, opportunityStageSchema } from "./crm.validation.js";
import { createActivity, createContact, createInteraction, createLead, createOpportunity, createOpportunityQuote, customerHistory, listActivities, listContacts, listInteractions, listLeads, listOpportunities, markLeadLost, qualifyLead, setOpportunityStage } from "./crm.service.js";

const pathId = (value: string | string[] | undefined, code: string, label: string) => {
  if (!value || Array.isArray(value)) throw new HttpError(400, code, `${label} invalido`);
  return value;
};

export const createCrmRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/leads", requirePermission("crm.create"), asyncHandler(async (req, res) => {
    const input = leadSchema.parse({ ...req.body, branchId: req.body?.branchId ?? req.branchId });
    res.status(201).json({ success: true, data: await createLead(req.auth!.id, req.companyId!, input), message: "Lead creado" });
  }));
  router.get("/leads", requirePermission("crm.read"), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listLeads(req.companyId!, branchFilterFor(req)), message: "Leads obtenidos" });
  }));
  router.post("/leads/:leadId/qualify", requirePermission("crm.update"), asyncHandler(async (req, res) => {
    const id = pathId(req.params.leadId, "INVALID_LEAD_ID", "Lead");
    res.json({ success: true, data: await qualifyLead(req.companyId!, id, branchFilterFor(req)), message: "Lead calificado" });
  }));
  router.post("/leads/:leadId/lost", requirePermission("crm.update"), asyncHandler(async (req, res) => {
    const id = pathId(req.params.leadId, "INVALID_LEAD_ID", "Lead");
    res.json({ success: true, data: await markLeadLost(req.companyId!, id, branchFilterFor(req)), message: "Lead cerrado" });
  }));

  router.post("/opportunities", requirePermission("crm.create"), asyncHandler(async (req, res) => {
    const input = opportunitySchema.parse({ ...req.body, branchId: req.body?.branchId ?? req.branchId });
    res.status(201).json({ success: true, data: await createOpportunity(req.auth!.id, req.companyId!, input, branchFilterFor(req)), message: "Oportunidad creada" });
  }));
  router.get("/opportunities", requirePermission("crm.read"), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listOpportunities(req.companyId!, branchFilterFor(req)), message: "Oportunidades obtenidas" });
  }));
  router.post("/opportunities/:opportunityId/quote", requirePermission("crm.create"), asyncHandler(async (req, res) => {
    const id = pathId(req.params.opportunityId, "INVALID_OPPORTUNITY_ID", "Oportunidad");
    const { lines } = opportunityQuoteSchema.parse(req.body);
    res.status(201).json({ success: true, data: await createOpportunityQuote(req.auth!.id, req.companyId!, id, lines, branchFilterFor(req)), message: "Cotizacion generada para la oportunidad" });
  }));
  router.post("/opportunities/:opportunityId/close", requirePermission("crm.update"), asyncHandler(async (req, res) => {
    const id = pathId(req.params.opportunityId, "INVALID_OPPORTUNITY_ID", "Oportunidad");
    const { stage } = opportunityStageSchema.parse(req.body);
    res.json({ success: true, data: await setOpportunityStage(req.companyId!, id, stage, branchFilterFor(req)), message: "Oportunidad cerrada" });
  }));

  router.post("/contacts", requirePermission("crm.create"), asyncHandler(async (req, res) => {
    res.status(201).json({ success: true, data: await createContact(req.auth!.id, req.companyId!, contactSchema.parse(req.body), branchFilterFor(req)), message: "Contacto creado" });
  }));
  router.get("/contacts", requirePermission("crm.read"), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listContacts(req.companyId!, branchFilterFor(req)), message: "Contactos obtenidos" });
  }));
  router.post("/activities", requirePermission("crm.create"), asyncHandler(async (req, res) => {
    const input = activitySchema.parse({ ...req.body, branchId: req.body?.branchId ?? req.branchId });
    res.status(201).json({ success: true, data: await createActivity(req.auth!.id, req.companyId!, input, branchFilterFor(req)), message: "Actividad registrada" });
  }));
  router.get("/activities", requirePermission("crm.read"), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listActivities(req.companyId!, branchFilterFor(req)), message: "Actividades obtenidas" });
  }));
  router.post("/interactions", requirePermission("crm.create"), asyncHandler(async (req, res) => {
    const input = interactionSchema.parse({ ...req.body, branchId: req.body?.branchId ?? req.branchId });
    res.status(201).json({ success: true, data: await createInteraction(req.auth!.id, req.companyId!, input, branchFilterFor(req)), message: "Interaccion registrada" });
  }));
  router.get("/interactions", requirePermission("crm.read"), asyncHandler(async (req, res) => {
    res.json({ success: true, data: await listInteractions(req.companyId!, branchFilterFor(req)), message: "Interacciones obtenidas" });
  }));
  router.get("/customers/:customerId/history", requirePermission("crm.read"), asyncHandler(async (req, res) => {
    const id = pathId(req.params.customerId, "INVALID_CUSTOMER_ID", "Cliente");
    res.json({ success: true, data: await customerHistory(req.companyId!, id, branchFilterFor(req)), message: "Historial de cliente obtenido" });
  }));
  return router;
};
