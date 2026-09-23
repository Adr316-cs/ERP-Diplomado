import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { getDashboard, getSalesReport } from "./report.service.js";
import { reportQuerySchema } from "./report.validation.js";

export const createReportRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.get("/dashboard", asyncHandler(async (req, res) => { const query = reportQuerySchema.parse(req.query); const data = await getDashboard(req.companyId!, query.branchId); res.json({ success: true, data, message: "Dashboard obtenido" }); }));
  router.get("/sales", asyncHandler(async (req, res) => { const query = reportQuerySchema.parse(req.query); const data = await getSalesReport(req.companyId!, query.from, query.to, query.branchId); res.json({ success: true, data, message: "Reporte de ventas obtenido" }); }));
  return router;
};