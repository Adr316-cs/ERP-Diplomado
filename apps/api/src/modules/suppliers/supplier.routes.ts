import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { registerSupplier, listSuppliers } from "./supplier.service.js";
import { supplierSchema } from "./supplier.validation.js";

export const createSupplierRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/", asyncHandler(async (request, response) => {
    const supplier = await registerSupplier(request.auth!.id, request.companyId!, supplierSchema.parse(request.body));
    response.status(201).json({ success: true, data: supplier, message: "Proveedor creado" });
  }));

  router.get("/", asyncHandler(async (request, response) => {
    const suppliers = await listSuppliers(request.companyId!);
    response.status(200).json({ success: true, data: suppliers, message: "Proveedores obtenidos" });
  }));

  return router;
};