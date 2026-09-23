import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { registerProduct, listProducts } from "./product.service.js";
import { productSchema } from "./product.validation.js";

export const createProductRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/", asyncHandler(async (request, response) => {
    const product = await registerProduct(request.auth!.id, request.companyId!, productSchema.parse(request.body));
    response.status(201).json({ success: true, data: product, message: "Producto creado" });
  }));

  router.get("/", asyncHandler(async (request, response) => {
    const products = await listProducts(request.companyId!);
    response.status(200).json({ success: true, data: products, message: "Productos obtenidos" });
  }));

  return router;
};