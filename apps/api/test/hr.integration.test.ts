import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { UserCompanyModel, UserModel } from "../src/modules/auth/auth.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { AttendanceModel, EmployeeDocumentModel, LeaveModel } from "../src/modules/hr/hr.model.js";
import { createAttendance, createContract, createDepartment, createEmployee, createEmployeeDocument, createLeave, createPosition, listAttendance, listContracts, listEmployees, listEmployeeDocuments, listLeaves, listPositions, updateLeaveStatus } from "../src/modules/hr/hr.service.js";

test("HR manages employees and records within tenant, branch and workflow boundaries", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => { await disconnectDatabase(); await replicaSet.stop(); });
  await connectDatabase(replicaSet.getUri());

  const adminId = new Types.ObjectId(); const userId = new Types.ObjectId(); const outsideUserId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "HR Integration Co", createdBy: adminId });
  const branch = await BranchModel.create({ companyId: company._id, name: "Main", code: "MAIN", createdBy: adminId });
  const otherBranch = await BranchModel.create({ companyId: company._id, name: "Other", code: "OTHER", createdBy: adminId });
  await UserModel.create([
    { _id: userId, email: "employee@hr.test", name: "Employee", passwordHash: "not-a-login-test" },
    { _id: outsideUserId, email: "outside@hr.test", name: "Outside", passwordHash: "not-a-login-test" }
  ]);
  await UserCompanyModel.create({ userId, companyId: company._id, branchIds: [branch._id], isOwner: false, assignedBy: adminId });
  const companyId = company._id.toString(); const branchId = branch._id.toString();

  const department = await createDepartment(adminId.toString(), companyId, { name: "Operations", code: "OPS" });
  const position = await createPosition(adminId.toString(), companyId, { departmentId: department._id.toString(), title: "Analyst", code: "ANALYST" });
  assert.equal((await listPositions(companyId)).length, 1);
  const employee = await createEmployee(adminId.toString(), companyId, { branchId, departmentId: department._id.toString(), positionId: position._id.toString(), userId: userId.toString(), firstName: "Ana", lastName: "García", email: "ana@hr.test", position: "Analyst", hireDate: new Date("2026-01-10") });
  await assert.rejects(createEmployee(adminId.toString(), companyId, { branchId, departmentId: department._id.toString(), userId: outsideUserId.toString(), firstName: "Other", lastName: "User", email: "other@hr.test", position: "Analyst", hireDate: new Date() }), { code: "USER_COMPANY_MISMATCH" });
  assert.equal((await listEmployees(companyId, { branchId: otherBranch._id })).length, 0);

  const contract = await createContract(adminId.toString(), companyId, { employeeId: employee._id.toString(), type: "FULL_TIME", startDate: new Date("2026-01-10"), salary: 50_000, currency: "MXN" }, { branchId: branch._id });
  const attendance = await createAttendance(adminId.toString(), companyId, { employeeId: employee._id.toString(), date: new Date("2026-09-24"), checkIn: new Date("2026-09-24T15:00:00Z"), checkOut: new Date("2026-09-24T23:00:00Z") }, { branchId: branch._id });
  const leave = await createLeave(userId.toString(), companyId, { employeeId: employee._id.toString(), type: "VACATION", startDate: new Date("2026-10-01"), endDate: new Date("2026-10-02") }, { branchId: branch._id });
  assert.equal(leave.status, "PENDING");
  await assert.rejects(updateLeaveStatus(userId.toString(), companyId, leave._id.toString(), "APPROVED", { branchId: branch._id }), { code: "LEAVE_SELF_APPROVAL_FORBIDDEN" });
  const decidedLeave = await updateLeaveStatus(adminId.toString(), companyId, leave._id.toString(), "APPROVED", { branchId: branch._id });
  assert.equal(decidedLeave.reviewedBy?.toString(), adminId.toString());
  await assert.rejects(updateLeaveStatus(adminId.toString(), companyId, leave._id.toString(), "REJECTED", { branchId: branch._id }), { code: "LEAVE_ALREADY_DECIDED" });
  const document = await createEmployeeDocument(adminId.toString(), companyId, employee._id.toString(), { name: "Identity document", category: "IDENTITY", storageKey: "hr/employees/identity/1", contentType: "application/pdf", sizeBytes: 1024, expiresAt: new Date("2030-01-01") }, { branchId: branch._id });
  await assert.rejects(listEmployeeDocuments(companyId, employee._id.toString(), { branchId: otherBranch._id }), { code: "EMPLOYEE_NOT_FOUND" });
  assert.equal((await listContracts(companyId, { branchId: branch._id })).length, 1);
  assert.equal((await listAttendance(companyId, { branchId: branch._id })).length, 1);
  assert.equal((await listLeaves(companyId, { branchId: branch._id }))[0]?.status, "APPROVED");
  assert.equal((await EmployeeDocumentModel.findById(document._id))?.storageKey, "hr/employees/identity/1");
  assert.ok(await AttendanceModel.findById(attendance._id));
  assert.ok(await LeaveModel.findById(decidedLeave._id));
  assert.ok(contract);
});
