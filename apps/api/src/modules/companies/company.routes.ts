import { Router } from "express";
import { loadEnvironment, type Environment } from "../../config/environment.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext, requireCompanyOwner } from "../../middleware/tenant.js";
import { branchSchema, companySchema } from "./company.validation.js";
import { listBranches, listCompanies, registerBranch, registerCompany } from "./company.service.js";

export const createCompanyRouter = (_environment: Environment = loadEnvironment()) => {
  const router = Router();
  router.use(requireAuth);

  router.post("/", asyncHandler(async (request, response) => {
    const company = await registerCompany(request.auth!.id, companySchema.parse(request.body));
    response.status(201).json({ success: true, data: company, message: "Empresa creada" });
  }));

  router.get("/", asyncHandler(async (request, response) => {
    const companies = await listCompanies(request.auth!.id);
    response.status(200).json({ success: true, data: companies, message: "Empresas obtenidas" });
  }));

  router.post("/:companyId/branches", requireCompanyContext, requireCompanyOwner, asyncHandler(async (request, response) => {
    const branch = await registerBranch(request.auth!.id, request.companyId!, branchSchema.parse(request.body));
    response.status(201).json({ success: true, data: branch, message: "Sucursal creada" });
  }));

  router.get("/:companyId/branches", requireCompanyContext, asyncHandler(async (request, response) => {
    const branches = await listBranches(request.auth!.id, request.companyId!);
    response.status(200).json({ success: true, data: branches, message: "Sucursales obtenidas" });
  }));

  return router;
};