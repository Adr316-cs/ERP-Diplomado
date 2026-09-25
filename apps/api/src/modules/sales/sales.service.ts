import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { InventoryMovementModel } from "../inventory/inventory-movement.model.js";
import { ProductModel } from "../products/product.model.js";
import { TaxModel } from "../master-data/master-data.model.js";
import { AccountsReceivableModel } from "../finance/finance.model.js";
import { WarehouseModel } from "../warehouses/warehouse.model.js";
import { SalesOrderModel } from "./sales.model.js";
import { createQuote, createSale, findOrderById, findOrdersByCompany, findQuotesByCompany, findQuoteById, findSalesByCompany } from "./sales.repository.js";
import type { SalesLine, SalesLineInput } from "./sales.types.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

const validObjectId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invÃ¡lido`);
};

const prepareLines = async (companyId: string, lines: SalesLineInput[], session?: mongoose.ClientSession): Promise<SalesLine[]> => {
  const prepared: SalesLine[] = [];
  for (const line of lines) {
    validObjectId(line.productId, "INVALID_PRODUCT_ID", "Producto");
    const query = ProductModel.findOne({ _id: line.productId, companyId, isActive: true });
    const product = session ? await query.session(session) : await query;
    if (!product) throw new HttpError(400, "PRODUCT_COMPANY_MISMATCH", "El producto no pertenece a la empresa");
    const unitPrice = product.salePrice ?? product.unitPrice;
    const total = Number((unitPrice * line.quantity).toFixed(2));
    prepared.push({ productId: line.productId, quantity: line.quantity, unitPrice, total });
  }
  return prepared;
};

const validateCustomerAndBranch = async (companyId: string, customerId: string, branchId: string, session?: mongoose.ClientSession) => {
  validObjectId(customerId, "INVALID_CUSTOMER_ID", "Cliente");
  validObjectId(branchId, "INVALID_BRANCH_ID", "Sucursal");
  const customerQuery = CustomerModel.exists({ _id: customerId, companyId, isActive: true });
  const branchQuery = BranchModel.exists({ _id: branchId, companyId, isActive: true });
  const [customer, branch] = await Promise.all([session ? customerQuery.session(session) : customerQuery, session ? branchQuery.session(session) : branchQuery]);
  if (!customer) throw new HttpError(400, "CUSTOMER_COMPANY_MISMATCH", "El cliente no pertenece a la empresa");
  if (!branch) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
};

export const registerQuote = async (userId: string, companyId: string, input: { branchId: string; customerId: string; opportunityId?: string | undefined; lines: SalesLineInput[] }, session?: mongoose.ClientSession) => {
  databaseRequired();
  await validateCustomerAndBranch(companyId, input.customerId, input.branchId, session);
  const lines = await prepareLines(companyId, input.lines, session);
  const amounts = await calculateAmounts(companyId, lines, session);
  return createQuote({ ...input, lines, ...amounts, companyId, createdBy: userId }, session);
};

export const listQuotes = async (companyId: string, branchFilter: Record<string, unknown> = {}) => { databaseRequired(); return findQuotesByCompany(companyId, branchFilter); };

const money = (value: number) => Number(value.toFixed(2));
const calculateAmounts = async (companyId: string, lines: SalesLine[], session?: mongoose.ClientSession) => {
  let subtotal = 0;
  let taxTotal = 0;
  let total = 0;
  for (const line of lines) {
    const productQuery = ProductModel.findOne({ _id: line.productId, companyId }).select("taxId");
    const product = session ? await productQuery.session(session) : await productQuery;
    const taxQuery = product?.taxId ? TaxModel.findOne({ _id: product.taxId, companyId, isActive: true }) : null;
    const tax = taxQuery ? session ? await taxQuery.session(session) : await taxQuery : null;
    const amount = line.total;
    if (!tax || tax.rate === 0) { subtotal += amount; total += amount; continue; }
    const taxAmount = tax.isInclusive ? money(amount - amount / (1 + tax.rate / 100)) : money(amount * tax.rate / 100);
    subtotal += tax.isInclusive ? amount - taxAmount : amount;
    taxTotal += taxAmount;
    total += tax.isInclusive ? amount : amount + taxAmount;
  }
  return { subtotal: money(subtotal), taxTotal: money(taxTotal), total: money(total) };
};

export const updateQuoteStatus = async (companyId: string, quoteId: string, action: "send" | "accept" | "reject", branchFilter: Record<string, unknown> = {}) => {
  databaseRequired(); validObjectId(quoteId, "INVALID_QUOTE_ID", "Cotización");
  const quote = await findQuoteById(companyId, quoteId, undefined, branchFilter);
  if (!quote) throw new HttpError(404, "QUOTE_NOT_FOUND", "Cotización no encontrada");
  const expected = action === "send" ? "DRAFT" : "SENT";
  if (quote.status !== expected) throw new HttpError(409, "QUOTE_STATE_INVALID", "La cotización no permite esta transición");
  quote.status = action === "send" ? "SENT" : action === "accept" ? "ACCEPTED" : "REJECTED";
  await quote.save();
  return quote;
};

export const registerOrder = async (userId: string, companyId: string, input: { branchId: string; warehouseId: string; customerId: string; quoteId?: string | undefined; lines: SalesLineInput[] }) => {
  databaseRequired();
  await validateCustomerAndBranch(companyId, input.customerId, input.branchId);
  validObjectId(input.warehouseId, "INVALID_WAREHOUSE_ID", "AlmacÃ©n");
  if (!await WarehouseModel.exists({ _id: input.warehouseId, companyId, isActive: true })) throw new HttpError(400, "WAREHOUSE_COMPANY_MISMATCH", "El almacÃ©n no pertenece a la empresa");
  throw new HttpError(409, "ORDER_REQUIRES_ACCEPTED_QUOTE", "Crea el pedido desde una cotizacion aceptada");
};

export const listOrders = async (companyId: string, branchFilter: Record<string, unknown> = {}) => { databaseRequired(); return findOrdersByCompany(companyId, branchFilter); };
export const listSales = async (companyId: string, branchFilter: Record<string, unknown> = {}) => { databaseRequired(); return findSalesByCompany(companyId, branchFilter); };

export const createOrderFromQuote = async (userId: string, companyId: string, quoteId: string, warehouseId: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  validObjectId(quoteId, "INVALID_QUOTE_ID", "Cotización");
  validObjectId(warehouseId, "INVALID_WAREHOUSE_ID", "Almacén");
  const session = await mongoose.startSession();
  try {
    let createdOrder;
    await session.withTransaction(async () => {
      const quote = await findQuoteById(companyId, quoteId, session, branchFilter);
      if (await SalesOrderModel.exists({ companyId, quoteId }).session(session)) throw new HttpError(409, "QUOTE_ALREADY_ORDERED", "La cotizacion ya genero un pedido");
      if (!quote || quote.status !== "ACCEPTED") throw new HttpError(409, "QUOTE_NOT_ACCEPTED", "Solo una cotización aceptada puede convertirse en pedido");
      const warehouse = await WarehouseModel.findOne({ _id: warehouseId, companyId, branchId: quote.branchId, isActive: true }).session(session);
      if (!warehouse) throw new HttpError(400, "WAREHOUSE_BRANCH_MISMATCH", "El almacén debe pertenecer a la sucursal de la cotización");
      const order = await SalesOrderModel.create([{
        companyId, branchId: quote.branchId, warehouseId: warehouse._id, customerId: quote.customerId,
        quoteId: quote._id, lines: quote.lines, subtotal: quote.subtotal, taxTotal: quote.taxTotal,
        total: quote.total, createdBy: userId
      }], { session });
      createdOrder = order[0];
    });
    return createdOrder;
  } finally { await session.endSession(); }
};

const changeOrderState = async (companyId: string, orderId: string, from: string, to: string, update: Record<string, unknown> = {}, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired(); validObjectId(orderId, "INVALID_ORDER_ID", "Pedido");
  const order = await SalesOrderModel.findOneAndUpdate({ _id: orderId, companyId, status: from, ...branchFilter }, { $set: { status: to, ...update } }, { new: true });
  if (!order) throw new HttpError(409, "ORDER_STATE_INVALID", "El pedido no permite esta transición");
  return order;
};

export const submitSalesOrder = (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => changeOrderState(companyId, id, "DRAFT", "SUBMITTED", {}, branchFilter);
export const requestSalesApproval = (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => changeOrderState(companyId, id, "SUBMITTED", "PENDING_APPROVAL", {}, branchFilter);
export const approveSalesOrder = async (userId: string, companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired(); validObjectId(id, "INVALID_ORDER_ID", "Pedido");
  const current = await SalesOrderModel.findOne({ _id: id, companyId, ...branchFilter });
  if (!current) throw new HttpError(404, "ORDER_NOT_FOUND", "Pedido no encontrado");
  if (current.createdBy.toString() === userId) throw new HttpError(403, "SALES_SELF_APPROVAL_FORBIDDEN", "Quien crea el pedido no puede aprobarlo");
  return changeOrderState(companyId, id, "PENDING_APPROVAL", "APPROVED", { approvedBy: userId, approvedAt: new Date() }, branchFilter);
};
export const rejectSalesOrder = (companyId: string, id: string, reason: string, branchFilter: Record<string, unknown> = {}) => changeOrderState(companyId, id, "PENDING_APPROVAL", "REJECTED", { rejectionReason: reason }, branchFilter);
export const startSalesPreparation = (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => changeOrderState(companyId, id, "APPROVED", "PREPARING", {}, branchFilter);
export const readySalesOrder = (companyId: string, id: string, branchFilter: Record<string, unknown> = {}) => changeOrderState(companyId, id, "PREPARING", "READY_FOR_DELIVERY", {}, branchFilter);

export const deliverSalesOrder = async (userId: string, companyId: string, orderId: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired(); validObjectId(orderId, "INVALID_ORDER_ID", "Pedido");
  const session = await mongoose.startSession();
  try {
    let sale;
    await session.withTransaction(async () => {
      const order = await findOrderById(companyId, orderId, session, branchFilter);
      if (!order || order.status !== "READY_FOR_DELIVERY") throw new HttpError(409, "ORDER_NOT_READY_FOR_DELIVERY", "El pedido debe estar listo para entrega");
      for (const line of order.lines) {
        const inventory = await InventoryModel.findOne({ companyId, warehouseId: order.warehouseId, productId: line.productId }).session(session);
        if (!inventory || inventory.quantity < line.quantity) throw new HttpError(409, "INSUFFICIENT_STOCK", "Existencias insuficientes para entregar el pedido");
        inventory.quantity -= line.quantity;
        inventory.updatedBy = new Types.ObjectId(userId);
        await inventory.save({ session });
        await InventoryMovementModel.create([{ companyId, productId: line.productId, warehouseId: order.warehouseId, type: "OUT", quantity: line.quantity, reason: `Entrega del pedido ${order._id.toString()}`, createdBy: userId }], { session });
      }
      order.status = "DELIVERED";
      order.deliveredBy = new Types.ObjectId(userId);
      order.deliveredAt = new Date();
      await order.save({ session });
      const created = await createSale({ companyId, branchId: order.branchId, warehouseId: order.warehouseId, customerId: order.customerId, orderId: order._id, lines: order.lines, subtotal: order.subtotal, taxTotal: order.taxTotal, total: order.total, createdBy: userId }, session);
      sale = created[0];
      await AccountsReceivableModel.create([{ companyId, customerId: order.customerId, saleId: sale!._id, originalAmount: order.total, outstandingAmount: order.total, createdBy: userId }], { session });
    });
    return sale;
  } finally { await session.endSession(); }
};

export const confirmOrder = async (userId: string, companyId: string, orderId: string) => {
  databaseRequired();
  validObjectId(orderId, "INVALID_ORDER_ID", "Pedido");
  const session = await mongoose.startSession();
  try {
    let sale;
    await session.withTransaction(async () => {
      const order = await findOrderById(companyId, orderId, session);
      if (!order) throw new HttpError(404, "ORDER_NOT_FOUND", "Pedido no encontrado");
      if (order.status !== "DRAFT") throw new HttpError(409, "ORDER_STATE_INVALID", "El pedido no estÃ¡ en estado borrador");
      for (const line of order.lines) {
        const inventory = await InventoryModel.findOne({ companyId, warehouseId: order.warehouseId, productId: line.productId }).session(session);
        if (!inventory || inventory.quantity < line.quantity) throw new HttpError(409, "INSUFFICIENT_STOCK", "Existencias insuficientes para confirmar el pedido");
        inventory.quantity -= line.quantity;
        inventory.updatedBy = new Types.ObjectId(userId);
        await inventory.save({ session });
        await InventoryMovementModel.create([{ companyId, productId: line.productId, warehouseId: order.warehouseId, type: "OUT", quantity: line.quantity, reason: `Venta del pedido ${order._id.toString()}`, createdBy: userId }], { session });
      }
      order.status = "CONFIRMED";
      order.confirmedBy = new Types.ObjectId(userId);
      order.confirmedAt = new Date();
      await order.save({ session });
      const created = await createSale({ companyId, branchId: order.branchId, warehouseId: order.warehouseId, customerId: order.customerId, orderId: order._id, lines: order.lines, subtotal: order.subtotal, total: order.total, createdBy: userId }, session);
      sale = created[0];
    });
    return sale;
  } finally { await session.endSession(); }
};

