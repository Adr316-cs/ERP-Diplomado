import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { UserCompanyModel } from "../auth/auth.model.js";
import { BranchModel } from "../branches/branch.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { SaleModel } from "../sales/sales.model.js";
import { registerQuote } from "../sales/sales.service.js";
import type { SalesLineInput } from "../sales/sales.types.js";
import { ContactModel, CrmActivityModel, CrmInteractionModel, LeadModel, OpportunityModel } from "./crm.model.js";

type Filter = Record<string, unknown>;
const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no esta disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invalido`); };

const validateBranch = async (companyId: string, branchId?: string) => {
  if (!branchId) return;
  assertId(branchId, "INVALID_BRANCH_ID", "Sucursal");
  if (!await BranchModel.exists({ _id: branchId, companyId, isActive: true })) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
};
const validateAssignedUser = async (companyId: string, userId: string, branchId?: string) => {
  assertId(userId, "INVALID_ASSIGNED_USER", "Usuario asignado");
  const query: Filter = { companyId, userId };
  if (branchId) query.$or = [{ isOwner: true }, { branchIds: new Types.ObjectId(branchId) }];
  if (!await UserCompanyModel.exists(query)) throw new HttpError(400, "ASSIGNED_USER_COMPANY_MISMATCH", "El usuario asignado no pertenece a la empresa o sucursal");
};
const findCustomer = async (companyId: string, customerId: string, branchFilter: Filter = {}) => {
  assertId(customerId, "INVALID_CUSTOMER_ID", "Cliente");
  const customer = await CustomerModel.findOne({ _id: customerId, companyId, isActive: true, ...branchFilter });
  if (!customer) throw new HttpError(400, "CUSTOMER_COMPANY_MISMATCH", "El cliente no pertenece a la empresa o sucursal");
  return customer;
};

export const createLead = async (userId: string, companyId: string, input: { branchId?: string | undefined; name: string; email?: string | undefined; phone?: string | undefined; organization?: string | undefined; source?: string | undefined; assignedTo: string }) => {
  databaseRequired();
  await validateBranch(companyId, input.branchId);
  await validateAssignedUser(companyId, input.assignedTo, input.branchId);
  return LeadModel.create({ ...input, companyId, createdBy: userId });
};
export const listLeads = async (companyId: string, branchFilter: Filter = {}) => {
  databaseRequired();
  return LeadModel.find({ companyId, ...branchFilter }).populate("assignedTo", "name email").populate("customerId", "name").sort({ createdAt: -1 });
};
export const qualifyLead = async (companyId: string, id: string, branchFilter: Filter = {}) => {
  databaseRequired(); assertId(id, "INVALID_LEAD_ID", "Lead");
  const lead = await LeadModel.findOneAndUpdate({ _id: id, companyId, status: "NEW", ...branchFilter }, { $set: { status: "QUALIFIED", qualifiedAt: new Date() } }, { new: true });
  if (!lead) throw new HttpError(409, "LEAD_STATE_INVALID", "El lead no se puede calificar desde su estado actual");
  return lead;
};
export const markLeadLost = async (companyId: string, id: string, branchFilter: Filter = {}) => {
  databaseRequired(); assertId(id, "INVALID_LEAD_ID", "Lead");
  const lead = await LeadModel.findOneAndUpdate({ _id: id, companyId, status: { $in: ["NEW", "QUALIFIED"] }, ...branchFilter }, { $set: { status: "LOST" } }, { new: true });
  if (!lead) throw new HttpError(409, "LEAD_STATE_INVALID", "El lead ya no se puede cerrar");
  return lead;
};

export const createOpportunity = async (userId: string, companyId: string, input: { branchId?: string | undefined; customerId?: string | undefined; leadId?: string | undefined; name: string; value: number; expectedCloseDate?: Date | undefined; assignedTo: string }, branchFilter: Filter = {}) => {
  databaseRequired();
  if (Boolean(input.customerId) === Boolean(input.leadId)) throw new HttpError(400, "OPPORTUNITY_TARGET_REQUIRED", "Indica un cliente o un lead, no ambos");
  let branchId = input.branchId;
  if (input.customerId) {
    const customer = await findCustomer(companyId, input.customerId, branchFilter);
    if (input.branchId && customer.branchId && customer.branchId.toString() !== input.branchId) throw new HttpError(400, "CUSTOMER_BRANCH_MISMATCH", "El cliente pertenece a otra sucursal");
    branchId ??= customer.branchId?.toString();
  }
  if (input.leadId) {
    assertId(input.leadId, "INVALID_LEAD_ID", "Lead");
    const lead = await LeadModel.findOne({ _id: input.leadId, companyId, status: "QUALIFIED", ...branchFilter });
    if (!lead) throw new HttpError(409, "LEAD_NOT_QUALIFIED", "Solo un lead calificado puede convertirse en oportunidad");
    branchId ??= lead.branchId?.toString();
  }
  await validateBranch(companyId, branchId);
  await validateAssignedUser(companyId, input.assignedTo, branchId);
  return OpportunityModel.create({
    companyId, branchId, ...(input.customerId ? { customerId: input.customerId } : {}), ...(input.leadId ? { leadId: input.leadId } : {}),
    name: input.name, value: input.value, stage: "QUALIFIED", expectedCloseDate: input.expectedCloseDate,
    assignedTo: input.assignedTo, createdBy: userId
  });
};
export const listOpportunities = async (companyId: string, branchFilter: Filter = {}) => {
  databaseRequired();
  return OpportunityModel.find({ companyId, ...branchFilter }).populate("customerId", "name").populate("leadId", "name status").populate("assignedTo", "name email").populate("quoteId").sort({ createdAt: -1 });
};

export const createOpportunityQuote = async (userId: string, companyId: string, opportunityId: string, lines: SalesLineInput[], branchFilter: Filter = {}) => {
  databaseRequired(); assertId(opportunityId, "INVALID_OPPORTUNITY_ID", "Oportunidad");
  const session = await mongoose.startSession();
  try {
    let quote;
    await session.withTransaction(async () => {
      const opportunity = await OpportunityModel.findOne({ _id: opportunityId, companyId, stage: "QUALIFIED", ...branchFilter }).session(session);
      if (!opportunity) throw new HttpError(409, "OPPORTUNITY_NOT_READY", "La oportunidad debe estar calificada y sin cotizacion");
      let customerId = opportunity.customerId?.toString();
      let branchId = opportunity.branchId?.toString();
      if (opportunity.leadId && !customerId) {
        const lead = await LeadModel.findOne({ _id: opportunity.leadId, companyId, status: "QUALIFIED" }).session(session);
        if (!lead) throw new HttpError(409, "LEAD_NOT_QUALIFIED", "El lead ya no esta disponible para convertir");
        branchId ??= lead.branchId?.toString();
        if (!branchId) throw new HttpError(409, "BRANCH_REQUIRED_FOR_QUOTE", "Asigna una sucursal al lead antes de cotizar");
        const customers = await CustomerModel.create([{ companyId, branchId, name: lead.name, email: lead.email, phone: lead.phone, isActive: true, createdBy: userId }], { session });
        const customer = customers[0]!;
        customerId = customer._id.toString();
        if (lead.email || lead.phone) await ContactModel.create([{ companyId, customerId: customer._id, name: lead.name, email: lead.email, phone: lead.phone, isPrimary: true, createdBy: userId }], { session });
        lead.status = "CONVERTED";
        lead.customerId = customer._id;
        lead.convertedAt = new Date();
        await lead.save({ session });
        opportunity.customerId = customer._id;
        opportunity.leadId = null;
      }
      if (!customerId || !branchId) throw new HttpError(409, "OPPORTUNITY_CUSTOMER_REQUIRED", "La oportunidad requiere cliente y sucursal para cotizar");
      quote = await registerQuote(userId, companyId, { customerId, branchId, opportunityId, lines }, session);
      opportunity.quoteId = quote._id;
      opportunity.stage = "PROPOSAL";
      await opportunity.save({ session });
    });
    return quote;
  } finally { await session.endSession(); }
};

export const setOpportunityStage = async (companyId: string, id: string, stage: "WON" | "LOST", branchFilter: Filter = {}) => {
  databaseRequired(); assertId(id, "INVALID_OPPORTUNITY_ID", "Oportunidad");
  const opportunity = await OpportunityModel.findOne({ _id: id, companyId, ...branchFilter });
  if (!opportunity) throw new HttpError(404, "OPPORTUNITY_NOT_FOUND", "Oportunidad no encontrada");
  if (stage === "WON") {
    if (opportunity.stage !== "PROPOSAL" || !opportunity.quoteId) throw new HttpError(409, "OPPORTUNITY_STATE_INVALID", "Debe existir una cotizacion antes de ganar la oportunidad");
    const deliveredOrder = await mongoose.model("SalesOrder").exists({ companyId, quoteId: opportunity.quoteId, status: "DELIVERED" });
    if (!deliveredOrder) throw new HttpError(409, "SALE_NOT_COMPLETED", "La oportunidad solo se gana tras entregar la venta");
  } else if (!["QUALIFIED", "PROPOSAL"].includes(opportunity.stage)) {
    throw new HttpError(409, "OPPORTUNITY_STATE_INVALID", "La oportunidad ya no se puede cerrar como perdida");
  }
  opportunity.stage = stage;
  await opportunity.save();
  return opportunity;
};

export const createContact = async (userId: string, companyId: string, input: { customerId: string; name: string; email?: string | undefined; phone?: string | undefined; title?: string | undefined; isPrimary: boolean }, branchFilter: Filter = {}) => {
  databaseRequired();
  await findCustomer(companyId, input.customerId, branchFilter);
  return ContactModel.create({ ...input, companyId, createdBy: userId });
};
export const listContacts = async (companyId: string, branchFilter: Filter = {}) => {
  databaseRequired();
  const customers = await CustomerModel.find({ companyId, isActive: true, ...branchFilter }).distinct("_id");
  return ContactModel.find({ companyId, customerId: { $in: customers }, isActive: true }).populate("customerId", "name").sort({ name: 1 });
};

export const createActivity = async (userId: string, companyId: string, input: { branchId?: string | undefined; customerId?: string | undefined; leadId?: string | undefined; opportunityId?: string | undefined; type: string; notes: string; occurredAt: Date }, branchFilter: Filter = {}) => {
  databaseRequired();
  if (Boolean(input.customerId) === Boolean(input.leadId)) throw new HttpError(400, "ACTIVITY_TARGET_REQUIRED", "Indica un cliente o un lead");
  if (input.customerId) await findCustomer(companyId, input.customerId, branchFilter);
  if (input.leadId) {
    assertId(input.leadId, "INVALID_LEAD_ID", "Lead");
    if (!await LeadModel.exists({ _id: input.leadId, companyId, ...branchFilter })) throw new HttpError(400, "LEAD_COMPANY_MISMATCH", "El lead no pertenece a la empresa o sucursal");
  }
  if (input.opportunityId) {
    assertId(input.opportunityId, "INVALID_OPPORTUNITY_ID", "Oportunidad");
    const opportunity = await OpportunityModel.findOne({ _id: input.opportunityId, companyId, ...branchFilter });
    const related = input.customerId ? opportunity?.customerId?.toString() === input.customerId : opportunity?.leadId?.toString() === input.leadId;
    if (!related) throw new HttpError(400, "OPPORTUNITY_COMPANY_MISMATCH", "La oportunidad no corresponde al cliente o lead");
  }
  return CrmActivityModel.create({ ...input, companyId, createdBy: userId });
};
export const listActivities = async (companyId: string, branchFilter: Filter = {}) => {
  databaseRequired(); return CrmActivityModel.find({ companyId, ...branchFilter }).populate("customerId", "name").populate("leadId", "name").populate("opportunityId", "name").sort({ occurredAt: -1 });
};

export const createInteraction = async (userId: string, companyId: string, input: { branchId?: string | undefined; customerId?: string | undefined; leadId?: string | undefined; opportunityId?: string | undefined; type: string; subject: string; summary: string; occurredAt: Date }, branchFilter: Filter = {}) => {
  databaseRequired();
  if (Boolean(input.customerId) === Boolean(input.leadId)) throw new HttpError(400, "INTERACTION_TARGET_REQUIRED", "Indica un cliente o un lead");
  if (input.customerId) await findCustomer(companyId, input.customerId, branchFilter);
  if (input.leadId) {
    assertId(input.leadId, "INVALID_LEAD_ID", "Lead");
    if (!await LeadModel.exists({ _id: input.leadId, companyId, ...branchFilter })) throw new HttpError(400, "LEAD_COMPANY_MISMATCH", "El lead no pertenece a la empresa o sucursal");
  }
  if (input.opportunityId) {
    assertId(input.opportunityId, "INVALID_OPPORTUNITY_ID", "Oportunidad");
    const opportunity = await OpportunityModel.findOne({ _id: input.opportunityId, companyId, ...branchFilter });
    const related = input.customerId ? opportunity?.customerId?.toString() === input.customerId : opportunity?.leadId?.toString() === input.leadId;
    if (!related) throw new HttpError(400, "OPPORTUNITY_COMPANY_MISMATCH", "La oportunidad no corresponde al cliente o lead");
  }
  return CrmInteractionModel.create({ ...input, companyId, createdBy: userId });
};
export const listInteractions = async (companyId: string, branchFilter: Filter = {}) => {
  databaseRequired(); return CrmInteractionModel.find({ companyId, ...branchFilter }).populate("customerId", "name").populate("leadId", "name").populate("opportunityId", "name").sort({ occurredAt: -1 });
};

export const customerHistory = async (companyId: string, customerId: string, branchFilter: Filter = {}) => {
  databaseRequired();
  const customer = await findCustomer(companyId, customerId, branchFilter);
  const leadIds = await LeadModel.find({ companyId, customerId }).distinct("_id");
  const historyTarget = { $or: [{ customerId }, { leadId: { $in: leadIds } }] };
  const [contacts, activities, interactions, opportunities, sales] = await Promise.all([
    ContactModel.find({ companyId, customerId, isActive: true }).sort({ name: 1 }),
    CrmActivityModel.find({ companyId, ...historyTarget }).sort({ occurredAt: -1 }),
    CrmInteractionModel.find({ companyId, ...historyTarget }).sort({ occurredAt: -1 }),
    OpportunityModel.find({ companyId, customerId }).sort({ updatedAt: -1 }),
    SaleModel.find({ companyId, customerId }).populate("orderId", "status").sort({ createdAt: -1 })
  ]);
  const entries = [
    ...activities.map((record) => ({ kind: "ACTIVITY", occurredAt: record.occurredAt, record })),
    ...interactions.map((record) => ({ kind: "INTERACTION", occurredAt: record.occurredAt, record })),
    ...opportunities.map((record) => ({ kind: "OPPORTUNITY", occurredAt: record.updatedAt, record })),
    ...sales.map((record) => ({ kind: "SALE", occurredAt: record.createdAt, record }))
  ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
  return { customer, contacts, activities, interactions, opportunities, sales, entries };
};
