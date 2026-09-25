import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { catalogQuerySchema } from "../../shared/catalog-query.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { registerProduct, listProducts, getProduct, updateProduct, deactivateProduct } from "./product.service.js";
import { productSchema, productUpdateSchema } from "./product.validation.js";

export const createProductRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/", requirePermission("products.create"), asyncHandler(async (request, response) => {
    const input = productSchema.parse({ ...request.body, branchId: request.body?.branchId ?? request.branchId });
    const product = await registerProduct(request.auth!.id, request.companyId!, input);
    response.status(201).json({ success: true, data: product, message: "Producto creado" });
  }));
  router.get("/", requirePermission("products.read"), asyncHandler(async (request, response) => {
    const products = await listProducts(request.companyId!, catalogQuerySchema.parse(request.query), branchFilterFor(request));
    response.json({ success: true, data: products.items, meta: products.meta, message: "Productos obtenidos" });
  }));
  router.get("/:productId", requirePermission("products.read"), asyncHandler(async (request, response) => {
    const id = request.params.productId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de producto inválido");
    response.json({ success: true, data: await getProduct(request.companyId!, id, branchFilterFor(request)), message: "Producto obtenido" });
  }));
  router.put("/:productId", requirePermission("products.update"), asyncHandler(async (request, response) => {
    const id = request.params.productId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de producto inválido");
    response.json({ success: true, data: await updateProduct(request.companyId!, id, productUpdateSchema.parse(request.body), branchFilterFor(request)), message: "Producto actualizado" });
  }));
  router.delete("/:productId", requirePermission("products.delete"), asyncHandler(async (request, response) => {
    const id = request.params.productId;
    if (!id || Array.isArray(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de producto inválido");
    response.json({ success: true, data: await deactivateProduct(request.companyId!, id, branchFilterFor(request)), message: "Producto dado de baja" });
  }));
  return router;
};
