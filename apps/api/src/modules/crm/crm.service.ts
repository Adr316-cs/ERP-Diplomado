import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { CustomerModel } from "../customers/customer.model.js";
import { CrmActivityModel, OpportunityModel } from "./crm.model.js";

const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`); };

const validateCustomer = async (companyId: string, customerId: string) => {
  assertId(customerId, "INVALID_CUSTOMER_ID", "Cliente");
  if (!await CustomerModel.exists({ _id: customerId, companyId, isActive: true })) throw new HttpError(400, "CUSTOMER_COMPANY_MISMATCH", "El cliente no pertenece a la empresa");
};

export const createOpportunity = async (userId: string, companyId: string, input: { customerId: string; name: string; value: number; stage: string; expectedCloseDate?: Date | undefined; assignedTo: string }) => {
  databaseRequired(); await validateCustomer(companyId, input.customerId); assertId(input.assignedTo, "INVALID_ASSIGNED_USER", "Usuario asignado");
  return OpportunityModel.create({ ...input, companyId, createdBy: userId });
};
export const listOpportunities = async (companyId: string) => { databaseRequired(); return OpportunityModel.find({ companyId }).sort({ createdAt: -1 }); };
export const createActivity = async (userId: string, companyId: string, input: { customerId: string; opportunityId?: string | undefined; type: string; notes: string; occurredAt: Date }) => {
  databaseRequired(); await validateCustomer(companyId, input.customerId);
  if (input.opportunityId) { assertId(input.opportunityId, "INVALID_OPPORTUNITY_ID", "Oportunidad"); if (!await OpportunityModel.exists({ _id: input.opportunityId, companyId })) throw new HttpError(400, "OPPORTUNITY_COMPANY_MISMATCH", "La oportunidad no pertenece a la empresa"); }
  return CrmActivityModel.create({ ...input, companyId, createdBy: userId });
};
export const listActivities = async (companyId: string) => { databaseRequired(); return CrmActivityModel.find({ companyId }).sort({ occurredAt: -1 }); };