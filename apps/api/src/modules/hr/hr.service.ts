import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { DepartmentModel, EmployeeModel, ContractModel, AttendanceModel, LeaveModel } from "./hr.model.js";

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

const assertId = (value: string, code: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`);
};

const assertDepartmentInCompany = async (companyId: string, departmentId: string) => {
  assertId(departmentId, "INVALID_DEPARTMENT_ID", "Departamento");
  if (!await DepartmentModel.exists({ _id: departmentId, companyId, isActive: true })) {
    throw new HttpError(400, "DEPARTMENT_COMPANY_MISMATCH", "El departamento no pertenece a la empresa");
  }
};

export const createDepartment = async (userId: string, companyId: string, input: { name: string; code: string }) => {
  databaseRequired();
  return DepartmentModel.create({ ...input, companyId, createdBy: userId });
};

export const listDepartments = async (companyId: string) => {
  databaseRequired();
  return DepartmentModel.find({ companyId, isActive: true }).sort({ name: 1 });
};

export const createEmployee = async (userId: string, companyId: string, input: { departmentId: string; userId: string; firstName: string; lastName: string; email: string; position: string; hireDate: Date; status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | undefined }) => {
  databaseRequired();
  await assertDepartmentInCompany(companyId, input.departmentId);
  assertId(input.userId, "INVALID_USER_ID", "Usuario");
  return EmployeeModel.create({ ...input, companyId, createdBy: userId });
};

export const listEmployees = async (companyId: string) => {
  databaseRequired();
  return EmployeeModel.find({ companyId }).sort({ lastName: 1, firstName: 1 });
};

export const createContract = async (userId: string, companyId: string, input: { employeeId: string; type: "FULL_TIME" | "PART_TIME" | "CONTRACT"; startDate: Date; endDate?: Date | undefined; salary: number; currency?: string | undefined }) => {
  databaseRequired();
  assertId(input.employeeId, "INVALID_EMPLOYEE_ID", "Empleado");
  if (!await EmployeeModel.exists({ _id: input.employeeId, companyId })) throw new HttpError(400, "EMPLOYEE_COMPANY_MISMATCH", "El empleado no pertenece a la empresa");
  return ContractModel.create({ ...input, companyId, createdBy: userId });
};

export const listContracts = async (companyId: string) => {
  databaseRequired();
  return ContractModel.find({ companyId }).sort({ startDate: -1 });
};

export const createAttendance = async (userId: string, companyId: string, input: { employeeId: string; date: Date; checkIn?: Date | undefined; checkOut?: Date | undefined; status?: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | undefined }) => {
  databaseRequired();
  assertId(input.employeeId, "INVALID_EMPLOYEE_ID", "Empleado");
  if (!await EmployeeModel.exists({ _id: input.employeeId, companyId })) throw new HttpError(400, "EMPLOYEE_COMPANY_MISMATCH", "El empleado no pertenece a la empresa");
  return AttendanceModel.create({ ...input, companyId, createdBy: userId });
};

export const listAttendance = async (companyId: string) => {
  databaseRequired();
  return AttendanceModel.find({ companyId }).sort({ date: -1 });
};

export const createLeave = async (userId: string, companyId: string, input: { employeeId: string; type: "VACATION" | "SICK" | "PERSONAL" | "MATERNITY" | "UNPAID"; startDate: Date; endDate: Date; reason?: string | undefined; status?: "PENDING" | "APPROVED" | "REJECTED" | undefined }) => {
  databaseRequired();
  assertId(input.employeeId, "INVALID_EMPLOYEE_ID", "Empleado");
  if (!await EmployeeModel.exists({ _id: input.employeeId, companyId })) throw new HttpError(400, "EMPLOYEE_COMPANY_MISMATCH", "El empleado no pertenece a la empresa");
  return LeaveModel.create({ ...input, companyId, createdBy: userId });
};

export const listLeaves = async (companyId: string) => {
  databaseRequired();
  return LeaveModel.find({ companyId }).sort({ startDate: -1 });
};
