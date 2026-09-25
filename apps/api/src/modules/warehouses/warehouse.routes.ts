import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { catalogQuerySchema } from "../../shared/catalog-query.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { registerWarehouse, listWarehouses, getWarehouse, updateWarehouse, deactivateWarehouse } from "./warehouse.service.js";
import { warehouseSchema, warehouseUpdateSchema } from "./warehouse.validation.js";

export const createWarehouseRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/", requirePermission("warehouses.create"), asyncHandler(async (request, response) => {
    const input = warehouseSchema.parse({ ...request.body, branchId: request.body?.branchId ?? request.branchId });
    response.status(201).json({ success: true, data: await registerWarehouse(request.auth!.id, request.companyId!, input), message: "Almacén creado" });
  }));
  router.get("/", requirePermission("warehouses.read"), asyncHandler(async (request, response) => {
    const warehouses = await listWarehouses(request.companyId!, catalogQuerySchema.parse(request.query), branchFilterFor(request));
    response.json({ success: true, data: warehouses.items, meta: warehouses.meta, message: "Almacenes obtenidos" });
  }));
  router.get("/:warehouseId", requirePermission("warehouses.read"), asyncHandler(async (request, response) => {
    const id = request.params.warehouseId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de almacén inválido");
    response.json({ success: true, data: await getWarehouse(request.companyId!, id, branchFilterFor(request)), message: "Almacén obtenido" });
  }));
  router.put("/:warehouseId", requirePermission("warehouses.update"), asyncHandler(async (request, response) => {
    const id = request.params.warehouseId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de almacén inválido");
    response.json({ success: true, data: await updateWarehouse(request.companyId!, id, warehouseUpdateSchema.parse(request.body), branchFilterFor(request)), message: "Almacén actualizado" });
  }));
  router.delete("/:warehouseId", requirePermission("warehouses.delete"), asyncHandler(async (request, response) => {
    const id = request.params.warehouseId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de almacén inválido");
    response.json({ success: true, data: await deactivateWarehouse(request.companyId!, id, branchFilterFor(request)), message: "Almacén dado de baja" });
  }));
  return router;
};
