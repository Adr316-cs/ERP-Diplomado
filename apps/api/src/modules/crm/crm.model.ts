import { Schema, model, type InferSchemaType } from "mongoose";

const opportunitySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
  quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },
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
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
  opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
  type: { type: String, enum: ["CALL", "EMAIL", "MEETING", "NOTE"], required: true },
  notes: { type: String, required: true, trim: true, maxlength: 1000 },
  occurredAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
activitySchema.index({ companyId: 1, occurredAt: -1 });

const leadSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  organization: { type: String, trim: true, maxlength: 160 },
  source: { type: String, trim: true, maxlength: 80 },
  status: { type: String, enum: ["NEW", "QUALIFIED", "CONVERTED", "LOST"], required: true, default: "NEW" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  qualifiedAt: { type: Date },
  convertedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
leadSchema.index({ companyId: 1, status: 1, createdAt: -1 });
leadSchema.index({ companyId: 1, branchId: 1, email: 1 });

const contactSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  title: { type: String, trim: true, maxlength: 100 },
  isPrimary: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
contactSchema.index({ companyId: 1, customerId: 1, isActive: 1 });

const interactionSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
  opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
  type: { type: String, enum: ["CALL", "EMAIL", "MEETING", "MESSAGE", "OTHER"], required: true },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  summary: { type: String, required: true, trim: true, maxlength: 1500 },
  occurredAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
interactionSchema.index({ companyId: 1, occurredAt: -1 });

export type OpportunityDocument = InferSchemaType<typeof opportunitySchema>;
export type CrmActivityDocument = InferSchemaType<typeof activitySchema>;
export type LeadDocument = InferSchemaType<typeof leadSchema>;
export type ContactDocument = InferSchemaType<typeof contactSchema>;
export type CrmInteractionDocument = InferSchemaType<typeof interactionSchema>;
export const OpportunityModel = model("Opportunity", opportunitySchema);
export const CrmActivityModel = model("CrmActivity", activitySchema);
export const LeadModel = model("Lead", leadSchema);
export const ContactModel = model("Contact", contactSchema);
export const CrmInteractionModel = model("CrmInteraction", interactionSchema);
