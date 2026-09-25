import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { catalogQuerySchema } from "../../shared/catalog-query.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { registerCategory, listCategories, getCategory, updateCategory, deactivateCategory } from "./category.service.js";
import { categorySchema, categoryUpdateSchema } from "./category.validation.js";

export const createCategoryRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/", requirePermission("categories.create"), asyncHandler(async (request, response) => {
    response.status(201).json({ success: true, data: await registerCategory(request.auth!.id, request.companyId!, categorySchema.parse(request.body)), message: "Categoría creada" });
  }));
  router.get("/", requirePermission("categories.read"), asyncHandler(async (request, response) => {
    const categories = await listCategories(request.companyId!, catalogQuerySchema.parse(request.query));
    response.json({ success: true, data: categories.items, meta: categories.meta, message: "Categorías obtenidas" });
  }));
  router.get("/:categoryId", requirePermission("categories.read"), asyncHandler(async (request, response) => {
    const id = request.params.categoryId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de categoría inválido");
    response.json({ success: true, data: await getCategory(request.companyId!, id), message: "Categoría obtenida" });
  }));
  router.put("/:categoryId", requirePermission("categories.update"), asyncHandler(async (request, response) => {
    const id = request.params.categoryId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de categoría inválido");
    response.json({ success: true, data: await updateCategory(request.companyId!, id, categoryUpdateSchema.parse(request.body)), message: "Categoría actualizada" });
  }));
  router.delete("/:categoryId", requirePermission("categories.delete"), asyncHandler(async (request, response) => {
    const id = request.params.categoryId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de categoría inválido");
    response.json({ success: true, data: await deactivateCategory(request.companyId!, id), message: "Categoría dada de baja" });
  }));
  return router;
};
