import { Schema, model, type InferSchemaType } from "mongoose";

const projectSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
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

const projectMemberSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["MANAGER", "MEMBER"], required: true, default: "MEMBER" },
  addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
projectMemberSchema.index({ companyId: 1, projectId: 1, userId: 1 }, { unique: true });

const milestoneSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["PLANNED", "IN_PROGRESS", "COMPLETED"], required: true, default: "PLANNED" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
milestoneSchema.index({ companyId: 1, projectId: 1, dueDate: 1 });

const timeEntrySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Task" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  workDate: { type: Date, required: true },
  minutes: { type: Number, required: true, min: 1, max: 1440 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
timeEntrySchema.index({ companyId: 1, projectId: 1, workDate: -1 });

const projectExpenseSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 300 },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, uppercase: true, length: 3 },
  spentAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
projectExpenseSchema.index({ companyId: 1, projectId: 1, spentAt: -1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export type TaskDocument = InferSchemaType<typeof taskSchema>;
export type ProjectMemberDocument = InferSchemaType<typeof projectMemberSchema>;
export type MilestoneDocument = InferSchemaType<typeof milestoneSchema>;
export type TimeEntryDocument = InferSchemaType<typeof timeEntrySchema>;
export type ProjectExpenseDocument = InferSchemaType<typeof projectExpenseSchema>;
export const ProjectModel = model("Project", projectSchema);
export const TaskModel = model("Task", taskSchema);
export const ProjectMemberModel = model("ProjectMember", projectMemberSchema);
export const MilestoneModel = model("Milestone", milestoneSchema);
export const TimeEntryModel = model("TimeEntry", timeEntrySchema);
export const ProjectExpenseModel = model("ProjectExpense", projectExpenseSchema);
