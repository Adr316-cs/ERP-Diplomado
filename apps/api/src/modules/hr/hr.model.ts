import { Schema, model, type InferSchemaType } from "mongoose";

const departmentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

departmentSchema.index({ companyId: 1, code: 1 }, { unique: true });

const positionSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
  description: { type: String, trim: true, maxlength: 500 },
  isActive: { type: Boolean, required: true, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
positionSchema.index({ companyId: 1, code: 1 }, { unique: true });

const employeeSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  positionId: { type: Schema.Types.ObjectId, ref: "Position" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  firstName: { type: String, required: true, trim: true, maxlength: 100 },
  lastName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  position: { type: String, required: true, trim: true, maxlength: 120 },
  hireDate: { type: Date, required: true },
  status: { type: String, enum: ["ACTIVE", "INACTIVE", "ON_LEAVE"], required: true, default: "ACTIVE" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, userId: 1 }, { unique: true });

const contractSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["FULL_TIME", "PART_TIME", "CONTRACT"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  salary: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, length: 3, default: "USD" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const attendanceSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true, index: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true, default: "PRESENT" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true });

const leaveSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["VACATION", "SICK", "PERSONAL", "MATERNITY", "UNPAID"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], required: true, default: "PENDING" },
  reason: { type: String, trim: true, maxlength: 300 },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const employeeDocumentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  category: { type: String, required: true, enum: ["IDENTITY", "CONTRACT", "CERTIFICATE", "OTHER"] },
  storageKey: { type: String, required: true, trim: true, maxlength: 500 },
  contentType: { type: String, required: true, trim: true, maxlength: 120 },
  sizeBytes: { type: Number, required: true, min: 1, max: 25_000_000 },
  expiresAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
employeeDocumentSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });

export type DepartmentDocument = InferSchemaType<typeof departmentSchema>;
export type PositionDocument = InferSchemaType<typeof positionSchema>;
export type EmployeeDocument = InferSchemaType<typeof employeeSchema>;
export type ContractDocument = InferSchemaType<typeof contractSchema>;
export type AttendanceDocument = InferSchemaType<typeof attendanceSchema>;
export type LeaveDocument = InferSchemaType<typeof leaveSchema>;
export type EmployeeDocumentFile = InferSchemaType<typeof employeeDocumentSchema>;

export const DepartmentModel = model("Department", departmentSchema);
export const PositionModel = model("Position", positionSchema);
export const EmployeeModel = model("Employee", employeeSchema);
export const ContractModel = model("Contract", contractSchema);
export const AttendanceModel = model("Attendance", attendanceSchema);
export const LeaveModel = model("Leave", leaveSchema);
export const EmployeeDocumentModel = model("EmployeeDocument", employeeDocumentSchema);
