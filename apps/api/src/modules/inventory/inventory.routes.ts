import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requireInventoryMovementPermission, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { listInventory, listInventoryMovements, recordMovement } from "./inventory.service.js";
import { movementSchema } from "./inventory.validation.js";

export const createInventoryRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.get("/", requirePermission("inventory.read"), asyncHandler(async (request, response) => {
    const inventory = await listInventory(request.companyId!, branchFilterFor(request));
    response.status(200).json({ success: true, data: inventory, message: "Existencias obtenidas" });
  }));

  router.get("/movements", requirePermission("inventory.read"), asyncHandler(async (request, response) => {
    const movements = await listInventoryMovements(request.companyId!, branchFilterFor(request));
    response.status(200).json({ success: true, data: movements, message: "Historial de movimientos obtenido" });
  }));

  router.post("/movements", requireInventoryMovementPermission, asyncHandler(async (request, response) => {
    const movement = await recordMovement(request.auth!.id, request.companyId!, movementSchema.parse(request.body), { branchId: request.branchId, branchIds: request.branchIds ?? [], isCompanyOwner: request.isCompanyOwner ?? false });
    response.status(201).json({ success: true, data: movement, message: "Movimiento registrado" });
  }));

  return router;
};


