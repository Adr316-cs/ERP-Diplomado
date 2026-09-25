import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { loadEnvironment, type Environment } from "../../config/environment.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireCompanyContext, requireCompanyOwner } from "../../middleware/tenant.js";
import { branchSchema, companyMemberRolesSchema, companyMemberSchema, companySchema } from "./company.validation.js";
import { addCompanyMember, listBranches, listCompanies, listCompanyMembers, registerBranch, registerCompany, updateCompanyMemberRoles } from "./company.service.js";

export const createCompanyRouter = (_environment: Environment = loadEnvironment()) => {
  const router = Router();
  router.use(requireAuth);

  router.post("/", requirePermission("companies.create"), asyncHandler(async (request, response) => {
    const company = await registerCompany(request.auth!.id, companySchema.parse(request.body));
    response.status(201).json({ success: true, data: company, message: "Empresa creada" });
  }));

  router.get("/", requirePermission("companies.read"), asyncHandler(async (request, response) => {
    const companies = await listCompanies(request.auth!.id);
    response.status(200).json({ success: true, data: companies, message: "Empresas obtenidas" });
  }));

  router.get("/:companyId/users", requireCompanyContext, requireCompanyOwner, requirePermission("users.read"), asyncHandler(async (request, response) => {
    const users = await listCompanyMembers(request.companyId!);
    response.json({ success: true, data: users, message: "Miembros obtenidos" });
  }));

  router.post("/:companyId/users/:userId", requireCompanyContext, requireCompanyOwner, requirePermission("users.create"), asyncHandler(async (request, response) => {
    const userId = request.params.userId;
    if (!userId || Array.isArray(userId)) throw new HttpError(400, "INVALID_USER_ID", "Identificador de usuario inválido");
    const member = await addCompanyMember(request.auth!.id, request.companyId!, userId, companyMemberSchema.parse(request.body));
    response.status(201).json({ success: true, data: member, message: "Miembro agregado" });
  }));

  router.put("/:companyId/users/:userId/roles", requireCompanyContext, requireCompanyOwner, requirePermission("users.update"), asyncHandler(async (request, response) => {
    const userId = request.params.userId;
    if (!userId || Array.isArray(userId)) throw new HttpError(400, "INVALID_USER_ID", "Identificador de usuario inválido");
    const input = companyMemberRolesSchema.parse(request.body);
    const member = await updateCompanyMemberRoles(request.auth!.id, request.companyId!, userId, input.roleNames);
    response.json({ success: true, data: member, message: "Roles actualizados" });
  }));

  router.post("/:companyId/branches", requireCompanyContext, requireCompanyOwner, requirePermission("branches.create"), asyncHandler(async (request, response) => {
    const branch = await registerBranch(request.auth!.id, request.companyId!, branchSchema.parse(request.body));
    response.status(201).json({ success: true, data: branch, message: "Sucursal creada" });
  }));

  router.get("/:companyId/branches", requireCompanyContext, requirePermission("branches.read"), asyncHandler(async (request, response) => {
    const branches = await listBranches(request.auth!.id, request.companyId!);
    response.status(200).json({ success: true, data: branches, message: "Sucursales obtenidas" });
  }));

  return router;
};



