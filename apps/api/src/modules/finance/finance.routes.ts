import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { createAccount, listAccounts, recordPayment, recordTransaction } from "./finance.service.js";
import { accountSchema, paymentSchema, transactionSchema } from "./finance.validation.js";

export const createFinanceRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/accounts", asyncHandler(async (request, response) => {
    const account = await createAccount(request.auth!.id, request.companyId!, accountSchema.parse(request.body));
    response.status(201).json({ success: true, data: account, message: "Cuenta creada" });
  }));
  router.get("/accounts", asyncHandler(async (request, response) => {
    const accounts = await listAccounts(request.companyId!);
    response.status(200).json({ success: true, data: accounts, message: "Cuentas obtenidas" });
  }));
  router.post("/transactions", asyncHandler(async (request, response) => {
    const transaction = await recordTransaction(request.auth!.id, request.companyId!, transactionSchema.parse(request.body));
    response.status(201).json({ success: true, data: transaction, message: "Movimiento financiero registrado" });
  }));
  router.post("/payments", asyncHandler(async (request, response) => {
    const payment = await recordPayment(request.auth!.id, request.companyId!, paymentSchema.parse(request.body));
    response.status(201).json({ success: true, data: payment, message: "Pago registrado" });
  }));
  return router;
};