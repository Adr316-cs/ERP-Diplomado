import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { AuditLogModel } from "./audit.model.js";

type AuditInput = { userId: string; companyId: string; module: string; action: string; entity: string; entityId: string; result: "SUCCESS" | "FAILURE"; oldData?: unknown; newData?: unknown };

export const recordAudit = async (input: AuditInput) => {
  if (getDatabaseStatus() !== "connected") return;
  await AuditLogModel.create(input);
};

export const listAuditLogs = async (companyId: string) => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
  return AuditLogModel.find({ companyId }).sort({ createdAt: -1 }).limit(200);
};