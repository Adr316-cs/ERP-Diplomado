import { Schema, model, type InferSchemaType } from "mongoose";

const commentSchema = new Schema({ authorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, message: { type: String, required: true, trim: true, maxlength: 2000 }, createdAt: { type: Date, required: true, default: Date.now } }, { _id: false });
const attachmentSchema = new Schema({
  filename: { type: String, required: true, trim: true, maxlength: 180 },
  storageKey: { type: String, required: true, trim: true, maxlength: 500 },
  contentType: { type: String, required: true, trim: true, maxlength: 120 },
  sizeBytes: { type: Number, required: true, min: 1, max: 25_000_000 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, required: true, default: Date.now }
}, { _id: true });
const historySchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["CREATED", "STATUS_CHANGED", "ASSIGNED", "COMMENT_ADDED", "ATTACHMENT_ADDED"], required: true },
  fromStatus: { type: String, enum: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED", "CANCELLED"] },
  toStatus: { type: String, enum: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED", "CANCELLED"] },
  details: { type: String, trim: true, maxlength: 500 },
  createdAt: { type: Date, required: true, default: Date.now }
}, { _id: false });
const ticketSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], required: true, default: "MEDIUM" },
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED", "CANCELLED"], required: true, default: "OPEN" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  comments: { type: [commentSchema], required: true, default: [] },
  attachments: { type: [attachmentSchema], required: true, default: [] },
  history: { type: [historySchema], required: true, default: [] },
  slaDueAt: { type: Date, required: true },
  resolvedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
ticketSchema.index({ companyId: 1, status: 1, priority: 1 });
ticketSchema.index({ companyId: 1, slaDueAt: 1, status: 1 });

const helpdeskCategorySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
helpdeskCategorySchema.index({ companyId: 1, name: 1 }, { unique: true });

const slaPolicySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], required: true },
  targetMinutes: { type: Number, required: true, min: 1, max: 525_600 },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
slaPolicySchema.index({ companyId: 1, priority: 1 }, { unique: true });

export type TicketDocument = InferSchemaType<typeof ticketSchema>;
export type HelpdeskCategoryDocument = InferSchemaType<typeof helpdeskCategorySchema>;
export type SlaPolicyDocument = InferSchemaType<typeof slaPolicySchema>;
export const TicketModel = model("Ticket", ticketSchema);
export const HelpdeskCategoryModel = model("HelpdeskCategory", helpdeskCategorySchema);
export const SlaPolicyModel = model("SlaPolicy", slaPolicySchema);
