import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { catalogQuerySchema } from "../../shared/catalog-query.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { registerCustomer, listCustomers, getCustomer, updateCustomer, deactivateCustomer } from "./customer.service.js";
import { customerSchema, customerUpdateSchema } from "./customer.validation.js";

export const createCustomerRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/", requirePermission("customers.create"), asyncHandler(async (request, response) => {
    const input = customerSchema.parse({ ...request.body, branchId: request.body?.branchId ?? request.branchId });
    const customer = await registerCustomer(request.auth!.id, request.companyId!, input);
    response.status(201).json({ success: true, data: customer, message: "Cliente creado" });
  }));
  router.get("/", requirePermission("customers.read"), asyncHandler(async (request, response) => {
    const customers = await listCustomers(request.companyId!, catalogQuerySchema.parse(request.query), branchFilterFor(request));
    response.json({ success: true, data: customers.items, meta: customers.meta, message: "Clientes obtenidos" });
  }));
  router.get("/:customerId", requirePermission("customers.read"), asyncHandler(async (request, response) => {
    const id = request.params.customerId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de cliente inválido");
    response.json({ success: true, data: await getCustomer(request.companyId!, id, branchFilterFor(request)), message: "Cliente obtenido" });
  }));
  router.put("/:customerId", requirePermission("customers.update"), asyncHandler(async (request, response) => {
    const id = request.params.customerId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de cliente inválido");
    const customer = await updateCustomer(request.companyId!, id, customerUpdateSchema.parse(request.body), branchFilterFor(request));
    response.json({ success: true, data: customer, message: "Cliente actualizado" });
  }));
  router.delete("/:customerId", requirePermission("customers.delete"), asyncHandler(async (request, response) => {
    const id = request.params.customerId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de cliente inválido");
    response.json({ success: true, data: await deactivateCustomer(request.companyId!, id, branchFilterFor(request)), message: "Cliente dado de baja" });
  }));
  return router;
};
