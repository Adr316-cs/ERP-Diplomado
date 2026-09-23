import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { registerCategory, listCategories } from "./category.service.js";
import { categorySchema } from "./category.validation.js";

export const createCategoryRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/", asyncHandler(async (request, response) => {
    const category = await registerCategory(request.auth!.id, request.companyId!, categorySchema.parse(request.body));
    response.status(201).json({ success: true, data: category, message: "Categoría creada" });
  }));

  router.get("/", asyncHandler(async (request, response) => {
    const categories = await listCategories(request.companyId!);
    response.status(200).json({ success: true, data: categories, message: "Categorías obtenidas" });
  }));

  return router;
};