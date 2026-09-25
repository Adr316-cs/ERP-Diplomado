import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { catalogQuerySchema } from "../../shared/catalog-query.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { registerSupplier, listSuppliers, getSupplier, updateSupplier, deactivateSupplier } from "./supplier.service.js";
import { supplierSchema, supplierUpdateSchema } from "./supplier.validation.js";

export const createSupplierRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/", requirePermission("suppliers.create"), asyncHandler(async (request, response) => {
    const input = supplierSchema.parse({ ...request.body, branchId: request.body?.branchId ?? request.branchId });
    const supplier = await registerSupplier(request.auth!.id, request.companyId!, input);
    response.status(201).json({ success: true, data: supplier, message: "Proveedor creado" });
  }));
  router.get("/", requirePermission("suppliers.read"), asyncHandler(async (request, response) => {
    const suppliers = await listSuppliers(request.companyId!, catalogQuerySchema.parse(request.query), branchFilterFor(request));
    response.json({ success: true, data: suppliers.items, meta: suppliers.meta, message: "Proveedores obtenidos" });
  }));
  router.get("/:supplierId", requirePermission("suppliers.read"), asyncHandler(async (request, response) => {
    const id = request.params.supplierId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de proveedor inválido");
    response.json({ success: true, data: await getSupplier(request.companyId!, id, branchFilterFor(request)), message: "Proveedor obtenido" });
  }));
  router.put("/:supplierId", requirePermission("suppliers.update"), asyncHandler(async (request, response) => {
    const id = request.params.supplierId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de proveedor inválido");
    response.json({ success: true, data: await updateSupplier(request.companyId!, id, supplierUpdateSchema.parse(request.body), branchFilterFor(request)), message: "Proveedor actualizado" });
  }));
  router.delete("/:supplierId", requirePermission("suppliers.delete"), asyncHandler(async (request, response) => {
    const id = request.params.supplierId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de proveedor inválido");
    response.json({ success: true, data: await deactivateSupplier(request.companyId!, id, branchFilterFor(request)), message: "Proveedor dado de baja" });
  }));
  return router;
};
