import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { CustomerModel } from "../customers/customer.model.js";
import { TicketModel } from "./helpdesk.model.js";

const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`); };

export const createTicket = async (userId: string, companyId: string, input: { customerId?: string | undefined; title: string; description: string; category: string; priority: string; assignedTo?: string | undefined }) => {
  databaseRequired();
  if (input.customerId) { assertId(input.customerId, "INVALID_CUSTOMER_ID", "Cliente"); if (!await CustomerModel.exists({ _id: input.customerId, companyId, isActive: true })) throw new HttpError(400, "CUSTOMER_COMPANY_MISMATCH", "El cliente no pertenece a la empresa"); }
  if (input.assignedTo) assertId(input.assignedTo, "INVALID_ASSIGNED_USER", "Usuario asignado");
  return TicketModel.create({ ...input, companyId, createdBy: userId });
};
export const listTickets = async (companyId: string) => { databaseRequired(); return TicketModel.find({ companyId }).sort({ createdAt: -1 }); };
export const addTicketComment = async (userId: string, companyId: string, ticketId: string, message: string) => { databaseRequired(); assertId(ticketId, "INVALID_TICKET_ID", "Ticket"); const ticket = await TicketModel.findOne({ _id: ticketId, companyId }); if (!ticket) throw new HttpError(404, "TICKET_NOT_FOUND", "Ticket no encontrado"); ticket.comments.push({ authorId: new Types.ObjectId(userId), message, createdAt: new Date() }); await ticket.save(); return ticket; };