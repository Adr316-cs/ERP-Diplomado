import { Schema, model, type InferSchemaType } from "mongoose";

const auditSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  module: { type: String, required: true, trim: true, maxlength: 80 },
  action: { type: String, required: true, trim: true, maxlength: 40 },
  entity: { type: String, required: true, trim: true, maxlength: 80 },
  entityId: { type: String, required: true, maxlength: 100 },
  result: { type: String, enum: ["SUCCESS", "FAILURE"], required: true },
  oldData: { type: Schema.Types.Mixed },
  newData: { type: Schema.Types.Mixed }
}, { timestamps: true });
auditSchema.index({ companyId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditSchema>;
export const AuditLogModel = model("AuditLog", auditSchema);