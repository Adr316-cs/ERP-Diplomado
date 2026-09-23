import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { activitySchema, opportunitySchema } from "./crm.validation.js";
import { createActivity, createOpportunity, listActivities, listOpportunities } from "./crm.service.js";

export const createCrmRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.post("/opportunities", asyncHandler(async (req, res) => { const item = await createOpportunity(req.auth!.id, req.companyId!, opportunitySchema.parse(req.body)); res.status(201).json({ success: true, data: item, message: "Oportunidad creada" }); }));
  router.get("/opportunities", asyncHandler(async (req, res) => { const items = await listOpportunities(req.companyId!); res.json({ success: true, data: items, message: "Oportunidades obtenidas" }); }));
  router.post("/activities", asyncHandler(async (req, res) => { const item = await createActivity(req.auth!.id, req.companyId!, activitySchema.parse(req.body)); res.status(201).json({ success: true, data: item, message: "Seguimiento registrado" }); }));
  router.get("/activities", asyncHandler(async (req, res) => { const items = await listActivities(req.companyId!); res.json({ success: true, data: items, message: "Seguimientos obtenidos" }); }));
  return router;
};