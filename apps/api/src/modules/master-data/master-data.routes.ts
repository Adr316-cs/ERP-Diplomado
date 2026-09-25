import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { HttpError } from "../../middleware/errors.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { catalogQuerySchema } from "../../shared/catalog-query.js";
import { findMasterCatalogSpec, masterCatalogs } from "./master-data.service.js";

export const createMasterDataRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  for (const [catalog, spec] of Object.entries(masterCatalogs)) {
    router.post(`/${catalog}`, requirePermission(`${spec.permission}.create`), asyncHandler(async (request, response) => {
      const record = await spec.create(request.auth!.id, request.companyId!, request.body);
      response.status(201).json({ success: true, data: record, message: "Catálogo creado" });
    }));
    router.get(`/${catalog}`, requirePermission(`${spec.permission}.read`), asyncHandler(async (request, response) => {
      const page = await spec.list(request.companyId!, catalogQuerySchema.parse(request.query));
      response.json({ success: true, data: page.items, meta: page.meta, message: "Catálogo obtenido" });
    }));
    router.get(`/${catalog}/:id`, requirePermission(`${spec.permission}.read`), asyncHandler(async (request, response) => {
      const id = request.params.id;
      if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador inválido");
      const record = await spec.get(request.companyId!, id);
      response.json({ success: true, data: record, message: "Catálogo obtenido" });
    }));
    router.put(`/${catalog}/:id`, requirePermission(`${spec.permission}.update`), asyncHandler(async (request, response) => {
      const id = request.params.id;
      if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador inválido");
      const record = await spec.update(request.companyId!, id, request.body);
      response.json({ success: true, data: record, message: "Catálogo actualizado" });
    }));
    router.delete(`/${catalog}/:id`, requirePermission(`${spec.permission}.delete`), asyncHandler(async (request, response) => {
      const id = request.params.id;
      if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador inválido");
      const record = await spec.deactivate(request.companyId!, id);
      response.json({ success: true, data: record, message: "Catálogo dado de baja" });
    }));
  }

  router.all("/:catalog/*", (request, _response, next) => {
    if (!findMasterCatalogSpec(request.params.catalog ?? "")) next(new HttpError(404, "NOT_FOUND", "Catálogo no encontrado"));
    else next();
  });
  return router;
};
