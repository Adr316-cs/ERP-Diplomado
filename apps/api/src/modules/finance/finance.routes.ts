import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { createAccount, createBudget, listAccounts, listAccountsPayable, listAccountsReceivable, listBudgets, listPayments, listTransactions, recordPayment, recordTransaction } from "./finance.service.js";
import { accountSchema, budgetSchema, paymentSchema, transactionSchema } from "./finance.validation.js";

export const createFinanceRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);
  router.post("/accounts", requirePermission("finance.create"), asyncHandler(async (request, response) => {
    const account = await createAccount(request.auth!.id, request.companyId!, accountSchema.parse(request.body));
    response.status(201).json({ success: true, data: account, message: "Cuenta creada" });
  }));
  router.get("/accounts", requirePermission("finance.read"), asyncHandler(async (request, response) => {
    const accounts = await listAccounts(request.companyId!);
    response.status(200).json({ success: true, data: accounts, message: "Cuentas obtenidas" });
  }));
  router.get("/transactions", requirePermission("finance.read"), asyncHandler(async (request, response) => {
    const transactions = await listTransactions(request.companyId!);
    response.status(200).json({ success: true, data: transactions, message: "Movimientos financieros obtenidos" });
  }));
  router.get("/payments", requirePermission("finance.read"), asyncHandler(async (request, response) => {
    const payments = await listPayments(request.companyId!);
    response.status(200).json({ success: true, data: payments, message: "Pagos obtenidos" });
  }));
  router.post("/budgets", requirePermission("finance.create"), asyncHandler(async (request, response) => {
    const budget = await createBudget(request.auth!.id, request.companyId!, budgetSchema.parse(request.body));
    response.status(201).json({ success: true, data: budget, message: "Presupuesto creado" });
  }));
  router.get("/budgets", requirePermission("finance.read"), asyncHandler(async (request, response) => {
    const budgets = await listBudgets(request.companyId!);
    response.status(200).json({ success: true, data: budgets, message: "Presupuestos obtenidos" });
  }));
  router.get("/accounts-payable", requirePermission("finance.read"), asyncHandler(async (request, response) => {
    const payables = await listAccountsPayable(request.companyId!);
    response.status(200).json({ success: true, data: payables, message: "Cuentas por pagar obtenidas" });
  }));
  router.get("/accounts-receivable", requirePermission("finance.read"), asyncHandler(async (request, response) => {
    const receivables = await listAccountsReceivable(request.companyId!);
    response.status(200).json({ success: true, data: receivables, message: "Cuentas por cobrar obtenidas" });
  }));
  router.post("/transactions", requirePermission("finance.create"), asyncHandler(async (request, response) => {
    const transaction = await recordTransaction(request.auth!.id, request.companyId!, transactionSchema.parse(request.body));
    response.status(201).json({ success: true, data: transaction, message: "Movimiento financiero registrado" });
  }));
  router.post("/payments", requirePermission("finance.pay"), asyncHandler(async (request, response) => {
    const payment = await recordPayment(request.auth!.id, request.companyId!, paymentSchema.parse(request.body));
    response.status(201).json({ success: true, data: payment, message: "Pago registrado" });
  }));
  return router;
};
