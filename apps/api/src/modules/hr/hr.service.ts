import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { UserCompanyModel, UserModel } from "../auth/auth.model.js";
import { BranchModel } from "../branches/branch.model.js";
import { AttendanceModel, ContractModel, DepartmentModel, EmployeeDocumentModel, EmployeeModel, LeaveModel, PositionModel } from "./hr.model.js";

type Filter = Record<string, unknown>;
const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no esta disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invalido`); };
const assertBranch = async (companyId: string, branchId?: string) => {
  if (!branchId) return;
  assertId(branchId, "INVALID_BRANCH_ID", "Sucursal");
  if (!await BranchModel.exists({ _id: branchId, companyId, isActive: true })) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
};
const findEmployee = async (companyId: string, employeeId: string, branchFilter: Filter = {}) => {
  assertId(employeeId, "INVALID_EMPLOYEE_ID", "Empleado");
  const employee = await EmployeeModel.findOne({ _id: employeeId, companyId, ...branchFilter });
  if (!employee) throw new HttpError(404, "EMPLOYEE_NOT_FOUND", "Empleado no encontrado");
  return employee;
};
const validateEmployeeUser = async (companyId: string, userId: string, branchId?: string) => {
  assertId(userId, "INVALID_USER_ID", "Usuario");
  if (!await UserModel.exists({ _id: userId, isActive: true })) throw new HttpError(400, "USER_NOT_FOUND", "El usuario no existe o esta inactivo");
  const membershipFilter: Filter = { companyId, userId };
  if (branchId) membershipFilter.$or = [{ isOwner: true }, { branchIds: new Types.ObjectId(branchId) }];
  if (!await UserCompanyModel.exists(membershipFilter)) throw new HttpError(400, "USER_COMPANY_MISMATCH", "El usuario no pertenece a la empresa o sucursal");
};
const assertDepartmentInCompany = async (companyId: string, departmentId: string) => {
  assertId(departmentId, "INVALID_DEPARTMENT_ID", "Departamento");
  if (!await DepartmentModel.exists({ _id: departmentId, companyId, isActive: true })) throw new HttpError(400, "DEPARTMENT_COMPANY_MISMATCH", "El departamento no pertenece a la empresa");
};

export const createDepartment = async (userId: string, companyId: string, input: { name: string; code: string }) => { databaseRequired(); return DepartmentModel.create({ ...input, companyId, createdBy: userId }); };
export const listDepartments = async (companyId: string) => { databaseRequired(); return DepartmentModel.find({ companyId, isActive: true }).sort({ name: 1 }); };
export const createPosition = async (userId: string, companyId: string, input: { departmentId?: string | undefined; title: string; code: string; description?: string | undefined }) => {
  databaseRequired(); if (input.departmentId) await assertDepartmentInCompany(companyId, input.departmentId);
  return PositionModel.create({ ...input, companyId, createdBy: userId });
};
export const listPositions = async (companyId: string) => { databaseRequired(); return PositionModel.find({ companyId, isActive: true }).populate("departmentId", "name code").sort({ title: 1 }); };
export const createEmployee = async (userId: string, companyId: string, input: { branchId?: string | undefined; departmentId: string; positionId?: string | undefined; userId: string; firstName: string; lastName: string; email: string; position: string; hireDate: Date; status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | undefined }) => {
  databaseRequired(); await assertBranch(companyId, input.branchId); await assertDepartmentInCompany(companyId, input.departmentId); await validateEmployeeUser(companyId, input.userId, input.branchId);
  let positionTitle = input.position;
  if (input.positionId) {
    assertId(input.positionId, "INVALID_POSITION_ID", "Puesto");
    const position = await PositionModel.findOne({ _id: input.positionId, companyId, isActive: true });
    if (!position) throw new HttpError(400, "POSITION_COMPANY_MISMATCH", "El puesto no pertenece a la empresa o esta inactivo");
    if (position.departmentId && position.departmentId.toString() !== input.departmentId) throw new HttpError(400, "POSITION_DEPARTMENT_MISMATCH", "El puesto pertenece a otro departamento");
    positionTitle = position.title;
  }
  return EmployeeModel.create({ ...input, position: positionTitle, companyId, createdBy: userId });
};
export const listEmployees = async (companyId: string, branchFilter: Filter = {}) => { databaseRequired(); return EmployeeModel.find({ companyId, ...branchFilter }).populate("departmentId", "name code").populate("positionId", "title code").sort({ lastName: 1, firstName: 1 }); };
export const createContract = async (userId: string, companyId: string, input: { employeeId: string; type: "FULL_TIME" | "PART_TIME" | "CONTRACT"; startDate: Date; endDate?: Date | undefined; salary: number; currency?: string | undefined }, branchFilter: Filter = {}) => {
  databaseRequired(); const employee = await findEmployee(companyId, input.employeeId, branchFilter);
  return ContractModel.create({ ...input, companyId, branchId: employee.branchId, createdBy: userId });
};
export const listContracts = async (companyId: string, branchFilter: Filter = {}) => { databaseRequired(); return ContractModel.find({ companyId, ...branchFilter }).populate("employeeId", "firstName lastName email").sort({ startDate: -1 }); };
export const createAttendance = async (userId: string, companyId: string, input: { employeeId: string; date: Date; checkIn?: Date | undefined; checkOut?: Date | undefined; status?: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | undefined }, branchFilter: Filter = {}) => {
  databaseRequired(); const employee = await findEmployee(companyId, input.employeeId, branchFilter);
  return AttendanceModel.create({ ...input, companyId, branchId: employee.branchId, createdBy: userId });
};
export const listAttendance = async (companyId: string, branchFilter: Filter = {}) => { databaseRequired(); return AttendanceModel.find({ companyId, ...branchFilter }).populate("employeeId", "firstName lastName").sort({ date: -1 }); };
export const createLeave = async (userId: string, companyId: string, input: { employeeId: string; type: "VACATION" | "SICK" | "PERSONAL" | "MATERNITY" | "UNPAID"; startDate: Date; endDate: Date; reason?: string | undefined }, branchFilter: Filter = {}) => {
  databaseRequired(); const employee = await findEmployee(companyId, input.employeeId, branchFilter);
  return LeaveModel.create({ ...input, companyId, branchId: employee.branchId, status: "PENDING", createdBy: userId });
};
export const listLeaves = async (companyId: string, branchFilter: Filter = {}) => { databaseRequired(); return LeaveModel.find({ companyId, ...branchFilter }).populate("employeeId", "firstName lastName").sort({ startDate: -1 }); };
export const updateLeaveStatus = async (userId: string, companyId: string, leaveId: string, status: "APPROVED" | "REJECTED", branchFilter: Filter = {}) => {
  databaseRequired(); assertId(leaveId, "INVALID_LEAVE_ID", "Permiso");
  const leave = await LeaveModel.findOne({ _id: leaveId, companyId, ...branchFilter });
  if (!leave) throw new HttpError(404, "LEAVE_NOT_FOUND", "Permiso no encontrado");
  if (leave.status !== "PENDING") throw new HttpError(409, "LEAVE_ALREADY_DECIDED", "El permiso ya fue resuelto");
  const employee = await EmployeeModel.findOne({ _id: leave.employeeId, companyId });
  if (employee?.userId.toString() === userId) throw new HttpError(403, "LEAVE_SELF_APPROVAL_FORBIDDEN", "El empleado no puede aprobar su propio permiso");
  leave.status = status; leave.reviewedBy = new Types.ObjectId(userId); leave.reviewedAt = new Date(); await leave.save(); return leave;
};
export const createEmployeeDocument = async (userId: string, companyId: string, employeeId: string, input: { name: string; category: "IDENTITY" | "CONTRACT" | "CERTIFICATE" | "OTHER"; storageKey: string; contentType: string; sizeBytes: number; expiresAt?: Date | undefined }, branchFilter: Filter = {}) => {
  databaseRequired(); const employee = await findEmployee(companyId, employeeId, branchFilter);
  return EmployeeDocumentModel.create({ ...input, companyId, branchId: employee.branchId, employeeId: employee._id, createdBy: userId });
};
export const listEmployeeDocuments = async (companyId: string, employeeId: string, branchFilter: Filter = {}) => {
  databaseRequired(); await findEmployee(companyId, employeeId, branchFilter);
  return EmployeeDocumentModel.find({ companyId, employeeId, ...branchFilter }).sort({ createdAt: -1 });
};
