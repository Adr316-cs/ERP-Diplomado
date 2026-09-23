import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { listNotifications, markNotificationRead } from "./notification.service.js";

export const createNotificationRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.get("/", asyncHandler(async (request, response) => { const items = await listNotifications(request.auth!.id, request.companyId!); response.json({ success: true, data: items, message: "Notificaciones obtenidas" }); }));
  router.post("/:notificationId/read", asyncHandler(async (request, response) => { const id = request.params.notificationId; if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_NOTIFICATION_ID", "Notificación inválida"); const item = await markNotificationRead(request.auth!.id, request.companyId!, id); response.json({ success: true, data: item, message: "Notificación marcada como leída" }); }));
  return router;
};