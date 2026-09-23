import { Schema, model, type InferSchemaType } from "mongoose";

const opportunitySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  value: { type: Number, required: true, min: 0 },
  stage: { type: String, enum: ["LEAD", "QUALIFIED", "PROPOSAL", "WON", "LOST"], required: true, default: "LEAD" },
  expectedCloseDate: { type: Date },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
opportunitySchema.index({ companyId: 1, stage: 1 });

const activitySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
  type: { type: String, enum: ["CALL", "EMAIL", "MEETING", "NOTE"], required: true },
  notes: { type: String, required: true, trim: true, maxlength: 1000 },
  occurredAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
activitySchema.index({ companyId: 1, occurredAt: -1 });

export type OpportunityDocument = InferSchemaType<typeof opportunitySchema>;
export type CrmActivityDocument = InferSchemaType<typeof activitySchema>;
export const OpportunityModel = model("Opportunity", opportunitySchema);
export const CrmActivityModel = model("CrmActivity", activitySchema);