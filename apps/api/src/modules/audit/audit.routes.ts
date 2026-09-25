import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { listAuditLogs } from "./audit.service.js";

export const createAuditRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.get("/", requirePermission("audit.read"), asyncHandler(async (request, response) => {
    const logs = await listAuditLogs(request.companyId!);
    response.json({ success: true, data: logs, message: "AuditorÃ­a obtenida" });
  }));
  return router;
};
