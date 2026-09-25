import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { InventoryMovementModel } from "../inventory/inventory-movement.model.js";
import { ProductModel } from "../products/product.model.js";
import { SupplierModel } from "../suppliers/supplier.model.js";
import { WarehouseModel } from "../warehouses/warehouse.model.js";
import { TaxModel } from "../master-data/master-data.model.js";
import { AccountsPayableModel } from "../finance/finance.model.js";
import { calculatePurchaseAmounts } from "./purchase-pricing.js";
import { PurchaseOrderModel } from "./purchases.model.js";
import { PurchaseRequestModel } from "./purchase-request.model.js";
import { PurchaseQuotationModel } from "./purchase-quotation.model.js";
import { findPurchaseOrderById, findPurchaseOrdersByCompany } from "./purchases.repository.js";
import type { PurchaseLine, PurchaseLineInput } from "./purchases.types.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no estÃ¡ disponible");
};

const assertObjectId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invÃ¡lido`);
};

const prepareLines = async (companyId: string, lines: PurchaseLineInput[]): Promise<PurchaseLine[]> => {
  const prepared: PurchaseLine[] = [];
  for (const line of lines) {
    assertObjectId(line.productId, "INVALID_PRODUCT_ID", "Producto");
    const product = await ProductModel.findOne({ _id: line.productId, companyId, isActive: true });
    if (!product) throw new HttpError(400, "PRODUCT_COMPANY_MISMATCH", "El producto no pertenece a la empresa");
    let amounts;
    if (product.taxId) {
      const tax = await TaxModel.findOne({ _id: product.taxId, companyId, isActive: true });
      if (!tax) throw new HttpError(400, "PRODUCT_TAX_UNAVAILABLE", "El impuesto del producto no está activo en esta empresa");
      amounts = calculatePurchaseAmounts(line.unitCost, line.quantity, { rate: tax.rate, isInclusive: tax.isInclusive });
    } else amounts = calculatePurchaseAmounts(line.unitCost, line.quantity);
    prepared.push({ ...line, ...amounts });
  }
  return prepared;
};

export const listPurchaseOrders = async (companyId: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  return findPurchaseOrdersByCompany(companyId, branchFilter);
};

type PurchaseRequestInput = { branchId: string; warehouseId: string; reason: string; lines: { productId: string; quantity: number }[] };
export const createPurchaseRequest = async (userId: string, companyId: string, input: PurchaseRequestInput) => {
  databaseRequired();
  assertObjectId(input.branchId, "INVALID_BRANCH_ID", "Sucursal");
  assertObjectId(input.warehouseId, "INVALID_WAREHOUSE_ID", "Almacén");
  const [branch, warehouse] = await Promise.all([
    BranchModel.exists({ _id: input.branchId, companyId, isActive: true }),
    WarehouseModel.findOne({ _id: input.warehouseId, companyId, isActive: true })
  ]);
  if (!branch) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  if (!warehouse) throw new HttpError(400, "WAREHOUSE_COMPANY_MISMATCH", "El almacén no pertenece a la empresa");
  if (warehouse.branchId.toString() !== input.branchId) throw new HttpError(400, "WAREHOUSE_BRANCH_MISMATCH", "El almacén no pertenece a la sucursal seleccionada");
  if (new Set(input.lines.map((line) => line.productId)).size !== input.lines.length) throw new HttpError(400, "DUPLICATE_PURCHASE_PRODUCT", "La solicitud no puede repetir productos; consolida la cantidad en una línea");
  for (const line of input.lines) {
    assertObjectId(line.productId, "INVALID_PRODUCT_ID", "Producto");
    if (!await ProductModel.exists({ _id: line.productId, companyId, isActive: true })) throw new HttpError(400, "PRODUCT_COMPANY_MISMATCH", "El producto no pertenece a la empresa");
  }
  return PurchaseRequestModel.create({ ...input, companyId, createdBy: userId });
};

export const listPurchaseRequests = async (companyId: string, branchFilter: Record<string, unknown> = {}) => {
  databaseRequired();
  return PurchaseRequestModel.find({ companyId, ...branchFilter }).sort({ createdAt: -1 });
};

const transitionPurchaseRequest = async (companyId: string, requestId: string, from: string, to: string, fields: Record<string, unknown> = {}) => {
  databaseRequired();
  assertObjectId(requestId, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra");
  const updated = await PurchaseRequestModel.findOneAndUpdate({ _id: requestId, companyId, status: from }, { $set: { status: to, ...fields } }, { new: true, runValidators: true });
  if (updated) return updated;
  const existing = await PurchaseRequestModel.findOne({ _id: requestId, companyId });
  if (!existing) throw new HttpError(404, "PURCHASE_REQUEST_NOT_FOUND", "Solicitud de compra no encontrada");
  throw new HttpError(409, "PURCHASE_REQUEST_STATE_INVALID", `No se puede cambiar de ${existing.status} a ${to}`);
};

export const submitPurchaseRequest = (companyId: string, requestId: string) => transitionPurchaseRequest(companyId, requestId, "DRAFT", "SUBMITTED");
export const requestPurchaseRequestApproval = (companyId: string, requestId: string) => transitionPurchaseRequest(companyId, requestId, "SUBMITTED", "PENDING_APPROVAL");

export const approvePurchaseRequest = async (userId: string, companyId: string, requestId: string) => {
  databaseRequired();
  assertObjectId(requestId, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra");
  const existing = await PurchaseRequestModel.findOne({ _id: requestId, companyId });
  if (!existing) throw new HttpError(404, "PURCHASE_REQUEST_NOT_FOUND", "Solicitud de compra no encontrada");
  if (existing.createdBy.toString() === userId) throw new HttpError(403, "PURCHASE_SELF_APPROVAL_FORBIDDEN", "Quien crea la solicitud no puede aprobarla");
  return transitionPurchaseRequest(companyId, requestId, "PENDING_APPROVAL", "APPROVED", { approvedBy: new Types.ObjectId(userId), approvedAt: new Date() });
};

export const rejectPurchaseRequest = (userId: string, companyId: string, requestId: string, reason: string) =>
  transitionPurchaseRequest(companyId, requestId, "PENDING_APPROVAL", "REJECTED", { rejectedBy: new Types.ObjectId(userId), rejectedAt: new Date(), rejectionReason: reason });

export const cancelPurchaseRequest = async (companyId: string, requestId: string) => {
  databaseRequired();
  assertObjectId(requestId, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra");
  const updated = await PurchaseRequestModel.findOneAndUpdate({ _id: requestId, companyId, status: { $in: ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "REJECTED"] } }, { $set: { status: "CANCELLED" } }, { new: true, runValidators: true });
  if (updated) return updated;
  const existing = await PurchaseRequestModel.findOne({ _id: requestId, companyId });
  if (!existing) throw new HttpError(404, "PURCHASE_REQUEST_NOT_FOUND", "Solicitud de compra no encontrada");
  throw new HttpError(409, "PURCHASE_REQUEST_STATE_INVALID", "La solicitud ya no se puede cancelar");
};

export const createPurchaseQuotation = async (userId: string, companyId: string, input: {
  purchaseRequestId: string; supplierId: string; lines: PurchaseLineInput[]; validUntil?: Date | undefined; terms?: string | undefined;
}) => {
  databaseRequired();
  assertObjectId(input.purchaseRequestId, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra");
  assertObjectId(input.supplierId, "INVALID_SUPPLIER_ID", "Proveedor");
  const [purchaseRequest, supplier] = await Promise.all([
    PurchaseRequestModel.findOne({ _id: input.purchaseRequestId, companyId, status: "APPROVED" }),
    SupplierModel.exists({ _id: input.supplierId, companyId, isActive: true })
  ]);
  if (!purchaseRequest) throw new HttpError(409, "PURCHASE_REQUEST_NOT_READY", "Solo se cotizan solicitudes aprobadas");
  if (!supplier) throw new HttpError(400, "SUPPLIER_COMPANY_MISMATCH", "El proveedor no pertenece a la empresa");
  if (input.validUntil && input.validUntil.getTime() <= Date.now()) throw new HttpError(400, "QUOTATION_EXPIRED", "La vigencia de la cotización debe ser futura");
  const requested = new Map(purchaseRequest.lines.map((line) => [line.productId.toString(), line.quantity]));
  if (requested.size !== input.lines.length || input.lines.some((line) => requested.get(line.productId) !== line.quantity)) {
    throw new HttpError(400, "QUOTATION_LINES_MISMATCH", "La cotización debe incluir las cantidades exactas de la solicitud aprobada");
  }
  const lines = await prepareLines(companyId, input.lines);
  return PurchaseQuotationModel.create({
    ...input,
    lines,
    subtotal: Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2)),
    taxTotal: Number(lines.reduce((sum, line) => sum + line.taxAmount, 0).toFixed(2)),
    total: Number(lines.reduce((sum, line) => sum + line.total, 0).toFixed(2)),
    companyId,
    createdBy: userId
  });
};

export const listPurchaseQuotations = async (companyId: string, requestId: string) => {
  databaseRequired();
  assertObjectId(requestId, "INVALID_PURCHASE_REQUEST_ID", "Solicitud de compra");
  return PurchaseQuotationModel.find({ companyId, purchaseRequestId: requestId }).populate("supplierId", "name").sort({ total: 1, createdAt: -1 });
};

export const selectPurchaseQuotation = async (userId: string, companyId: string, quotationId: string) => {
  databaseRequired();
  assertObjectId(quotationId, "INVALID_PURCHASE_QUOTATION_ID", "Cotización");
  const session = await mongoose.startSession();
  try {
    let createdOrder;
    await session.withTransaction(async () => {
      const quotation = await PurchaseQuotationModel.findOne({ _id: quotationId, companyId, status: "OPEN" }).session(session);
      if (!quotation) throw new HttpError(404, "PURCHASE_QUOTATION_NOT_FOUND", "Cotización abierta no encontrada");
      if (quotation.validUntil && quotation.validUntil.getTime() <= Date.now()) throw new HttpError(409, "QUOTATION_EXPIRED", "La cotización ya venció");
      const purchaseRequest = await PurchaseRequestModel.findOne({ _id: quotation.purchaseRequestId, companyId, status: "APPROVED" }).session(session);
      if (!purchaseRequest) throw new HttpError(409, "PURCHASE_REQUEST_NOT_READY", "La solicitud ya fue convertida o dejó de estar aprobada");
      const [order] = await PurchaseOrderModel.create([{
        companyId,
        branchId: purchaseRequest.branchId,
        warehouseId: purchaseRequest.warehouseId,
        supplierId: quotation.supplierId,
        purchaseRequestId: purchaseRequest._id,
        quotationId: quotation._id,
        lines: quotation.lines,
        subtotal: quotation.subtotal,
        taxTotal: quotation.taxTotal,
        total: quotation.total,
        status: "DRAFT",
        createdBy: userId
      }], { session });
      const selected = await PurchaseQuotationModel.updateOne({ _id: quotation._id, companyId, status: "OPEN" }, { $set: { status: "SELECTED" } }, { session });
      if (selected.modifiedCount !== 1) throw new HttpError(409, "PURCHASE_QUOTATION_ALREADY_SELECTED", "La cotización ya fue seleccionada");
      await PurchaseQuotationModel.updateMany({ companyId, purchaseRequestId: purchaseRequest._id, _id: { $ne: quotation._id }, status: "OPEN" }, { $set: { status: "REJECTED" } }, { session });
      const converted = await PurchaseRequestModel.updateOne({ _id: purchaseRequest._id, companyId, status: "APPROVED" }, { $set: { status: "CONVERTED" } }, { session });
      if (converted.modifiedCount !== 1) throw new HttpError(409, "PURCHASE_REQUEST_ALREADY_CONVERTED", "La solicitud ya fue convertida");
      createdOrder = order;
    });
    return createdOrder;
  } finally {
    await session.endSession();
  }
};

const transitionPurchaseOrder = async (companyId: string, orderId: string, from: string, to: string, fields: Record<string, unknown> = {}) => {
  databaseRequired();
  assertObjectId(orderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
  const updated = await PurchaseOrderModel.findOneAndUpdate(
    { _id: orderId, companyId, status: from },
    { $set: { status: to, ...fields } },
    { new: true, runValidators: true }
  );
  if (updated) return updated;
  const existing = await findPurchaseOrderById(companyId, orderId);
  if (!existing) throw new HttpError(404, "PURCHASE_ORDER_NOT_FOUND", "Orden de compra no encontrada");
  throw new HttpError(409, "PURCHASE_ORDER_STATE_INVALID", `No se puede cambiar de ${existing.status} a ${to}`);
};

export const submitPurchaseOrder = (companyId: string, orderId: string) => transitionPurchaseOrder(companyId, orderId, "DRAFT", "SUBMITTED");
export const requestPurchaseApproval = (companyId: string, orderId: string) => transitionPurchaseOrder(companyId, orderId, "SUBMITTED", "PENDING_APPROVAL");

export const approvePurchaseOrder = async (userId: string, companyId: string, orderId: string) => {
  databaseRequired();
  assertObjectId(orderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
  const order = await findPurchaseOrderById(companyId, orderId);
  if (!order) throw new HttpError(404, "PURCHASE_ORDER_NOT_FOUND", "Orden de compra no encontrada");
  if (order.createdBy.toString() === userId) throw new HttpError(403, "PURCHASE_SELF_APPROVAL_FORBIDDEN", "Quien crea la orden no puede aprobarla");
  return transitionPurchaseOrder(companyId, orderId, "PENDING_APPROVAL", "APPROVED", { approvedBy: new Types.ObjectId(userId), approvedAt: new Date() });
};

export const rejectPurchaseOrder = async (userId: string, companyId: string, orderId: string, reason: string) =>
  transitionPurchaseOrder(companyId, orderId, "PENDING_APPROVAL", "REJECTED", { rejectedBy: new Types.ObjectId(userId), rejectedAt: new Date(), rejectionReason: reason });

export const cancelPurchaseOrder = async (companyId: string, orderId: string) => {
  databaseRequired();
  assertObjectId(orderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
  const updated = await PurchaseOrderModel.findOneAndUpdate(
    { _id: orderId, companyId, status: { $in: ["DRAFT", "SUBMITTED", "PENDING_APPROVAL", "REJECTED"] } },
    { $set: { status: "CANCELLED" } },
    { new: true, runValidators: true }
  );
  if (updated) return updated;
  const existing = await findPurchaseOrderById(companyId, orderId);
  if (!existing) throw new HttpError(404, "PURCHASE_ORDER_NOT_FOUND", "Orden de compra no encontrada");
  throw new HttpError(409, "PURCHASE_ORDER_STATE_INVALID", "La orden ya no se puede cancelar");
};

export const receivePurchaseOrder = async (userId: string, companyId: string, orderId: string) => {
  databaseRequired();
  assertObjectId(orderId, "INVALID_PURCHASE_ORDER_ID", "Orden de compra");
  const session = await mongoose.startSession();
  try {
    let receivedOrder;
    await session.withTransaction(async () => {
      const order = await findPurchaseOrderById(companyId, orderId, session);
      if (!order) throw new HttpError(404, "PURCHASE_ORDER_NOT_FOUND", "Orden de compra no encontrada");
      if (order.status !== "APPROVED") throw new HttpError(409, "PURCHASE_ORDER_STATE_INVALID", "La orden debe estar aprobada antes de recibirla");

      for (const line of order.lines) {
        const inventory = await InventoryModel.findOne({ companyId, warehouseId: order.warehouseId, productId: line.productId }).session(session);
        if (inventory) {
          inventory.quantity += line.quantity;
          inventory.updatedBy = new Types.ObjectId(userId);
          await inventory.save({ session });
        } else {
          await InventoryModel.create([{ companyId, warehouseId: order.warehouseId, productId: line.productId, quantity: line.quantity, updatedBy: userId }], { session });
        }
        await InventoryMovementModel.create([{ companyId, productId: line.productId, warehouseId: order.warehouseId, type: "IN", quantity: line.quantity, reason: `RecepciÃ³n de orden ${order._id.toString()}`, createdBy: userId }], { session });
      }

      await AccountsPayableModel.create([{
        companyId,
        supplierId: order.supplierId,
        purchaseOrderId: order._id,
        originalAmount: order.total,
        outstandingAmount: order.total,
        status: "OPEN",
        createdBy: userId
      }], { session });

      order.status = "RECEIVED";
      order.receivedAt = new Date();
      await order.save({ session });
      receivedOrder = order;
    });
    return receivedOrder;
  } finally {
    await session.endSession();
  }
};


