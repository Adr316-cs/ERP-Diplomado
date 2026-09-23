import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { registerWarehouse, listWarehouses } from "./warehouse.service.js";
import { warehouseSchema } from "./warehouse.validation.js";

export const createWarehouseRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/", asyncHandler(async (request, response) => {
    const warehouse = await registerWarehouse(request.auth!.id, request.companyId!, warehouseSchema.parse(request.body));
    response.status(201).json({ success: true, data: warehouse, message: "Almacén creado" });
  }));

  router.get("/", asyncHandler(async (request, response) => {
    const warehouses = await listWarehouses(request.companyId!);
    response.status(200).json({ success: true, data: warehouses, message: "Almacenes obtenidos" });
  }));

  return router;
};