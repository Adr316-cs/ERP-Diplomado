import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { registerCustomer, listCustomers } from "./customer.service.js";
import { customerSchema } from "./customer.validation.js";

export const createCustomerRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/", asyncHandler(async (request, response) => {
    const customer = await registerCustomer(request.auth!.id, request.companyId!, customerSchema.parse(request.body));
    response.status(201).json({ success: true, data: customer, message: "Cliente creado" });
  }));

  router.get("/", asyncHandler(async (request, response) => {
    const customers = await listCustomers(request.companyId!);
    response.status(200).json({ success: true, data: customers, message: "Clientes obtenidos" });
  }));

  return router;
};