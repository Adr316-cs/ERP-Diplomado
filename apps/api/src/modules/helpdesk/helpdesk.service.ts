import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { UserCompanyModel } from "../auth/auth.model.js";
import { BranchModel } from "../branches/branch.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { HelpdeskCategoryModel, SlaPolicyModel, TicketModel } from "./helpdesk.model.js";

type Filter = Record<string, unknown>;
const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no esta disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invalido`); };
const findTicket = async (companyId: string, ticketId: string, branchFilter: Filter = {}) => {
  assertId(ticketId, "INVALID_TICKET_ID", "Ticket");
  const ticket = await TicketModel.findOne({ _id: ticketId, companyId, ...branchFilter });
  if (!ticket) throw new HttpError(404, "TICKET_NOT_FOUND", "Ticket no encontrado");
  return ticket;
};
const validateAssignedUser = async (companyId: string, userId: string, branchId?: string) => {
  assertId(userId, "INVALID_ASSIGNED_USER", "Usuario asignado");
  const filter: Filter = { companyId, userId };
  if (branchId) filter.$or = [{ isOwner: true }, { branchIds: new Types.ObjectId(branchId) }];
  if (!await UserCompanyModel.exists(filter)) throw new HttpError(400, "USER_COMPANY_MISMATCH", "El usuario no pertenece a la empresa o sucursal");
};
const defaultSla = { LOW: 4320, MEDIUM: 1440, HIGH: 240, URGENT: 60 } as const;

export const createTicket = async (userId: string, companyId: string, input: { branchId?: string | undefined; customerId?: string | undefined; title: string; description: string; category: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; assignedTo?: string | undefined }) => {
  databaseRequired();
  if (input.branchId) { assertId(input.branchId, "INVALID_BRANCH_ID", "Sucursal"); if (!await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa"); }
  if (input.customerId) { assertId(input.customerId, "INVALID_CUSTOMER_ID", "Cliente"); const customerFilter: Filter = { _id: input.customerId, companyId, isActive: true }; if (input.branchId) customerFilter.branchId = input.branchId; if (!await CustomerModel.exists(customerFilter)) throw new HttpError(400, "CUSTOMER_COMPANY_MISMATCH", "El cliente no pertenece a la empresa o sucursal"); }
  if (input.assignedTo) await validateAssignedUser(companyId, input.assignedTo, input.branchId);
  const category = await HelpdeskCategoryModel.findOne({ companyId, name: input.category, isActive: true });
  if (!category) throw new HttpError(400, "HELPDESK_CATEGORY_NOT_FOUND", "La categoria no existe o esta inactiva");
  const policy = await SlaPolicyModel.findOne({ companyId, priority: input.priority });
  const targetMinutes = policy?.targetMinutes ?? defaultSla[input.priority];
  const ticket = await TicketModel.create({ ...input, companyId, slaDueAt: new Date(Date.now() + targetMinutes * 60_000), createdBy: userId, history: [{ actorId: userId, action: "CREATED", toStatus: "OPEN", details: "Ticket creado" }] });
  return ticket;
};
export const listTickets = async (companyId: string, branchFilter: Filter = {}) => { databaseRequired(); return TicketModel.find({ companyId, ...branchFilter }).sort({ createdAt: -1 }); };
export const addTicketComment = async (userId: string, companyId: string, ticketId: string, message: string, branchFilter: Filter = {}) => {
  databaseRequired(); const ticket = await findTicket(companyId, ticketId, branchFilter);
  if (["CLOSED", "CANCELLED"].includes(ticket.status)) throw new HttpError(409, "TICKET_TERMINAL", "No se pueden agregar comentarios a un ticket cerrado o cancelado");
  ticket.comments.push({ authorId: new Types.ObjectId(userId), message, createdAt: new Date() });
  ticket.history.push({ actorId: new Types.ObjectId(userId), action: "COMMENT_ADDED", details: "Comentario agregado", createdAt: new Date() });
  await ticket.save(); return ticket;
};
const transitions: Record<string, string[]> = { OPEN: ["IN_PROGRESS", "WAITING", "CANCELLED"], IN_PROGRESS: ["WAITING", "RESOLVED", "CANCELLED"], WAITING: ["IN_PROGRESS", "RESOLVED", "CANCELLED"], RESOLVED: ["CLOSED", "IN_PROGRESS"], CLOSED: [], CANCELLED: [] };
export const changeTicketStatus = async (userId: string, companyId: string, ticketId: string, status: "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED" | "CANCELLED", branchFilter: Filter = {}) => {
  databaseRequired(); const ticket = await findTicket(companyId, ticketId, branchFilter);
  if (!transitions[ticket.status]?.includes(status)) throw new HttpError(409, "INVALID_TICKET_TRANSITION", `No se permite cambiar de ${ticket.status} a ${status}`);
  const fromStatus = ticket.status; ticket.status = status;
  if (status === "RESOLVED") ticket.resolvedAt = new Date(); else if (status === "IN_PROGRESS") ticket.set("resolvedAt", undefined);
  ticket.history.push({ actorId: new Types.ObjectId(userId), action: "STATUS_CHANGED", fromStatus, toStatus: status, createdAt: new Date() });
  await ticket.save(); return ticket;
};
export const assignTicket = async (userId: string, companyId: string, ticketId: string, assignedTo: string | null, branchFilter: Filter = {}) => {
  databaseRequired(); const ticket = await findTicket(companyId, ticketId, branchFilter);
  if (assignedTo) await validateAssignedUser(companyId, assignedTo, ticket.branchId?.toString());
  const previous = ticket.assignedTo?.toString() ?? "sin asignar"; if (assignedTo) ticket.assignedTo = new Types.ObjectId(assignedTo); else ticket.set("assignedTo", undefined);
  ticket.history.push({ actorId: new Types.ObjectId(userId), action: "ASSIGNED", details: `Asignación: ${previous} → ${assignedTo ?? "sin asignar"}`, createdAt: new Date() });
  await ticket.save(); return ticket;
};
export const addTicketAttachment = async (userId: string, companyId: string, ticketId: string, input: { filename: string; storageKey: string; contentType: string; sizeBytes: number }, branchFilter: Filter = {}) => {
  databaseRequired(); const ticket = await findTicket(companyId, ticketId, branchFilter);
  if (["CLOSED", "CANCELLED"].includes(ticket.status)) throw new HttpError(409, "TICKET_TERMINAL", "No se pueden adjuntar archivos a un ticket cerrado o cancelado");
  ticket.attachments.push({ ...input, uploadedBy: new Types.ObjectId(userId), uploadedAt: new Date() });
  ticket.history.push({ actorId: new Types.ObjectId(userId), action: "ATTACHMENT_ADDED", details: `Archivo agregado: ${input.filename}`, createdAt: new Date() });
  await ticket.save(); return ticket;
};
export const listTicketHistory = async (companyId: string, ticketId: string, branchFilter: Filter = {}) => { databaseRequired(); const ticket = await findTicket(companyId, ticketId, branchFilter); return ticket.history; };
export const listCategories = async (companyId: string) => { databaseRequired(); return HelpdeskCategoryModel.find({ companyId, isActive: true }).sort({ name: 1 }); };
export const createCategory = async (userId: string, companyId: string, name: string) => { databaseRequired(); return HelpdeskCategoryModel.create({ companyId, name, createdBy: userId }); };
export const listSlaPolicies = async (companyId: string) => { databaseRequired(); return SlaPolicyModel.find({ companyId }).sort({ priority: 1 }); };
export const upsertSlaPolicy = async (userId: string, companyId: string, input: { priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; targetMinutes: number }) => {
  databaseRequired(); return SlaPolicyModel.findOneAndUpdate({ companyId, priority: input.priority }, { $set: { targetMinutes: input.targetMinutes, updatedBy: userId }, $setOnInsert: { companyId, priority: input.priority } }, { new: true, upsert: true, runValidators: true });
};
