import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { listInventory, recordMovement } from "./inventory.service.js";
import { movementSchema } from "./inventory.validation.js";

export const createInventoryRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.get("/", asyncHandler(async (request, response) => {
    const inventory = await listInventory(request.companyId!);
    response.status(200).json({ success: true, data: inventory, message: "Existencias obtenidas" });
  }));

  router.post("/movements", asyncHandler(async (request, response) => {
    const movement = await recordMovement(request.auth!.id, request.companyId!, movementSchema.parse(request.body));
    response.status(201).json({ success: true, data: movement, message: "Movimiento registrado" });
  }));

  return router;
};