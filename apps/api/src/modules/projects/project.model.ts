import { Schema, model, type InferSchemaType } from "mongoose";

const projectSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"], required: true, default: "PLANNED" },
  startDate: { type: Date }, endDate: { type: Date },
  managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const taskSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"], required: true, default: "TODO" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date },
  hours: { type: Number, required: true, min: 0, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
taskSchema.index({ companyId: 1, projectId: 1, status: 1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export type TaskDocument = InferSchemaType<typeof taskSchema>;
export const ProjectModel = model("Project", projectSchema);
export const TaskModel = model("Task", taskSchema);