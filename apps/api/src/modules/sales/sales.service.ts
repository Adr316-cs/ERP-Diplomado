import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { BranchModel } from "../branches/branch.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { InventoryMovementModel } from "../inventory/inventory-movement.model.js";
import { ProductModel } from "../products/product.model.js";
import { WarehouseModel } from "../warehouses/warehouse.model.js";
import { createOrder, createQuote, createSale, findOrderById, findOrdersByCompany, findQuotesByCompany } from "./sales.repository.js";
import type { SalesLine, SalesLineInput } from "./sales.types.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

const validObjectId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`);
};

const prepareLines = async (companyId: string, lines: SalesLineInput[], session?: mongoose.ClientSession): Promise<SalesLine[]> => {
  const prepared: SalesLine[] = [];
  for (const line of lines) {
    validObjectId(line.productId, "INVALID_PRODUCT_ID", "Producto");
    const query = ProductModel.findOne({ _id: line.productId, companyId, isActive: true });
    const product = session ? await query.session(session) : await query;
    if (!product) throw new HttpError(400, "PRODUCT_COMPANY_MISMATCH", "El producto no pertenece a la empresa");
    const unitPrice = line.unitPrice ?? product.unitPrice;
    const total = Number((unitPrice * line.quantity).toFixed(2));
    prepared.push({ productId: line.productId, quantity: line.quantity, unitPrice, total });
  }
  return prepared;
};

const validateCustomerAndBranch = async (companyId: string, customerId: string, branchId: string) => {
  validObjectId(customerId, "INVALID_CUSTOMER_ID", "Cliente");
  validObjectId(branchId, "INVALID_BRANCH_ID", "Sucursal");
  const [customer, branch] = await Promise.all([
    CustomerModel.exists({ _id: customerId, companyId, isActive: true }),
    BranchModel.exists({ _id: branchId, companyId, isActive: true })
  ]);
  if (!customer) throw new HttpError(400, "CUSTOMER_COMPANY_MISMATCH", "El cliente no pertenece a la empresa");
  if (!branch) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
};

export const registerQuote = async (userId: string, companyId: string, input: { branchId: string; customerId: string; lines: SalesLineInput[] }) => {
  databaseRequired();
  await validateCustomerAndBranch(companyId, input.customerId, input.branchId);
  const lines = await prepareLines(companyId, input.lines);
  const subtotal = Number(lines.reduce((sum, line) => sum + line.total, 0).toFixed(2));
  return createQuote({ ...input, lines, subtotal, total: subtotal, companyId, createdBy: userId });
};

export const listQuotes = async (companyId: string) => { databaseRequired(); return findQuotesByCompany(companyId); };

export const registerOrder = async (userId: string, companyId: string, input: { branchId: string; warehouseId: string; customerId: string; quoteId?: string | undefined; lines: SalesLineInput[] }) => {
  databaseRequired();
  await validateCustomerAndBranch(companyId, input.customerId, input.branchId);
  validObjectId(input.warehouseId, "INVALID_WAREHOUSE_ID", "Almacén");
  if (!await WarehouseModel.exists({ _id: input.warehouseId, companyId, isActive: true })) throw new HttpError(400, "WAREHOUSE_COMPANY_MISMATCH", "El almacén no pertenece a la empresa");
  const lines = await prepareLines(companyId, input.lines);
  const subtotal = Number(lines.reduce((sum, line) => sum + line.total, 0).toFixed(2));
  return createOrder({ ...input, lines, subtotal, total: subtotal, companyId, createdBy: userId });
};

export const listOrders = async (companyId: string) => { databaseRequired(); return findOrdersByCompany(companyId); };

export const confirmOrder = async (userId: string, companyId: string, orderId: string) => {
  databaseRequired();
  validObjectId(orderId, "INVALID_ORDER_ID", "Pedido");
  const session = await mongoose.startSession();
  try {
    let sale;
    await session.withTransaction(async () => {
      const order = await findOrderById(companyId, orderId, session);
      if (!order) throw new HttpError(404, "ORDER_NOT_FOUND", "Pedido no encontrado");
      if (order.status !== "DRAFT") throw new HttpError(409, "ORDER_STATE_INVALID", "El pedido no está en estado borrador");
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