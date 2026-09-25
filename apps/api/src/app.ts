import cors from "cors";
import express, { type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createRequire } from "node:module";
import { loadEnvironment } from "./config/environment.js";
import { getDatabaseStatus } from "./database/mongoose.js";
import { errorHandler, HttpError } from "./middleware/errors.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createCompanyRouter } from "./modules/companies/company.routes.js";
import { createCategoryRouter } from "./modules/categories/category.routes.js";
import { createMasterDataRouter } from "./modules/master-data/master-data.routes.js";
import { createCustomerRouter } from "./modules/customers/customer.routes.js";
import { createProductRouter } from "./modules/products/product.routes.js";
import { createSupplierRouter } from "./modules/suppliers/supplier.routes.js";
import { createInventoryRouter } from "./modules/inventory/inventory.routes.js";
import { createWarehouseRouter } from "./modules/warehouses/warehouse.routes.js";
import { createSalesRouter } from "./modules/sales/sales.routes.js";
import { createPurchasesRouter } from "./modules/purchases/purchases.routes.js";
import { createFinanceRouter } from "./modules/finance/finance.routes.js";
import { createCrmRouter } from "./modules/crm/crm.routes.js";
import { createProjectRouter } from "./modules/projects/project.routes.js";
import { createHelpdeskRouter } from "./modules/helpdesk/helpdesk.routes.js";
import { createHrRouter } from "./modules/hr/hr.routes.js";
import { createAuditRouter } from "./modules/audit/audit.routes.js";
import { createNotificationRouter } from "./modules/notifications/notification.routes.js";
import { createReportRouter } from "./modules/reports/report.routes.js";
import { logger } from "./observability/logger.js";

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http") as (options: { logger: typeof logger }) => RequestHandler;

export const createApp = (environment = loadEnvironment()) => {
  const app = express();

  app.disable("x-powered-by");
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(cors({ origin: environment.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 100 }));
  app.use("/api/v1/auth", createAuthRouter(environment));
  app.use("/api/v1/companies", createCompanyRouter(environment));
  app.use("/api/v1/companies/:companyId/customers", createCustomerRouter());
  app.use("/api/v1/companies/:companyId/suppliers", createSupplierRouter());
  app.use("/api/v1/companies/:companyId/categories", createCategoryRouter());
  app.use("/api/v1/companies/:companyId/master-data", createMasterDataRouter());
  app.use("/api/v1/companies/:companyId/products", createProductRouter());
  app.use("/api/v1/companies/:companyId/warehouses", createWarehouseRouter());
  app.use("/api/v1/companies/:companyId/inventory", createInventoryRouter());
  app.use("/api/v1/companies/:companyId/sales", createSalesRouter());
  app.use("/api/v1/companies/:companyId/purchases", createPurchasesRouter());
  app.use("/api/v1/companies/:companyId/finance", createFinanceRouter());
  app.use("/api/v1/companies/:companyId/crm", createCrmRouter());
  app.use("/api/v1/companies/:companyId/projects", createProjectRouter());
  app.use("/api/v1/companies/:companyId/helpdesk", createHelpdeskRouter());
  app.use("/api/v1/companies/:companyId/hr", createHrRouter());
  app.use("/api/v1/companies/:companyId/audit", createAuditRouter());
  app.use("/api/v1/companies/:companyId/notifications", createNotificationRouter());
  app.use("/api/v1/companies/:companyId/reports", createReportRouter());

  app.get("/api/v1/health", (_request, response) => {
    response.status(200).json({
      success: true,
      data: { status: "ok", environment: environment.NODE_ENV, uptime: process.uptime() },
      message: "API disponible"
    });
  });

  app.get("/api/v1/health/ready", (_request, response) => {
    const database = environment.MONGODB_URI.length === 0 ? "disabled" : getDatabaseStatus();
    const ready = database === "connected" || (database === "disabled" && environment.NODE_ENV !== "production");

    response.status(ready ? 200 : 503).json({
      success: ready,
      data: { status: ready ? "ready" : "not_ready", database },
      ...(ready ? { message: "API lista para recibir solicitudes" } : { message: "Dependencias no disponibles", code: "NOT_READY" })
    });
  });

  app.use((_request, _response) => {
    throw new HttpError(404, "NOT_FOUND", "Recurso no encontrado");
  });

  app.use(errorHandler);
  return app;
};
