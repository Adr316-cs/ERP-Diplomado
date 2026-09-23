import { Schema, model, type InferSchemaType } from "mongoose";

const commentSchema = new Schema({ authorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, message: { type: String, required: true, trim: true, maxlength: 2000 }, createdAt: { type: Date, required: true, default: Date.now } }, { _id: false });
const ticketSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], required: true, default: "MEDIUM" },
  status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], required: true, default: "OPEN" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  comments: { type: [commentSchema], required: true, default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
ticketSchema.index({ companyId: 1, status: 1, priority: 1 });

export type TicketDocument = InferSchemaType<typeof ticketSchema>;
export const TicketModel = model("Ticket", ticketSchema);