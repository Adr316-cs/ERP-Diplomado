import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { UserCompanyModel } from "../src/modules/auth/auth.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { addProjectMember, createMilestone, createProject, createProjectExpense, createTask, createTimeEntry, listMilestones, listProjectExpenses, listProjectMembers, listTimeEntries, updateMilestoneStatus } from "../src/modules/projects/project.service.js";
import { TaskModel } from "../src/modules/projects/project.model.js";
import { addTicketAttachment, addTicketComment, assignTicket, changeTicketStatus, createCategory, createTicket, listTicketHistory, listTickets, upsertSlaPolicy } from "../src/modules/helpdesk/helpdesk.service.js";
import { TicketModel } from "../src/modules/helpdesk/helpdesk.model.js";

test("projects and Help Desk lifecycle works across a MongoDB replica set", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => { await disconnectDatabase(); await replicaSet.stop(); });
  await connectDatabase(replicaSet.getUri());

  const ownerId = new Types.ObjectId(); const memberId = new Types.ObjectId();
  const company = await CompanyModel.create({ name: "Projects Help Desk Integration Co", createdBy: ownerId });
  const branch = await BranchModel.create({ companyId: company._id, name: "Main", code: "MAIN", createdBy: ownerId });
  await UserCompanyModel.create([
    { userId: ownerId, companyId: company._id, branchIds: [branch._id], isOwner: false, assignedBy: ownerId },
    { userId: memberId, companyId: company._id, branchIds: [branch._id], isOwner: false, assignedBy: ownerId }
  ]);
  const companyId = company._id.toString(); const branchId = branch._id.toString();
  const project = await createProject(ownerId.toString(), companyId, { branchId, name: "Implementation", managerId: ownerId.toString(), startDate: new Date("2026-09-01") });
  assert.ok(project);
  await addProjectMember(ownerId.toString(), companyId, project!._id.toString(), { userId: memberId.toString(), role: "MEMBER" }, { branchId: branch._id });
  const task = await createTask(ownerId.toString(), companyId, { projectId: project!._id.toString(), title: "Planning", assignedTo: memberId.toString(), hours: 0 }, { branchId: branch._id });
  const milestone = await createMilestone(ownerId.toString(), companyId, project!._id.toString(), { name: "Design signed off", dueDate: new Date("2026-10-01") }, { branchId: branch._id });
  await updateMilestoneStatus(companyId, project!._id.toString(), milestone._id.toString(), "COMPLETED", { branchId: branch._id });
  const timeEntry = await createTimeEntry(memberId.toString(), companyId, project!._id.toString(), { taskId: task._id.toString(), workDate: new Date(), minutes: 90, description: "Planning work" }, { branchId: branch._id });
  const expense = await createProjectExpense(ownerId.toString(), companyId, project!._id.toString(), { description: "Travel", amount: 125, currency: "USD", spentAt: new Date() }, { branchId: branch._id });
  assert.ok(timeEntry); assert.ok(expense);
  assert.equal((await TaskModel.findById(task._id))?.hours, 1.5);
  assert.equal((await listProjectMembers(companyId, project!._id.toString(), { branchId: branch._id })).length, 2);
  assert.equal((await listMilestones(companyId, project!._id.toString(), { branchId: branch._id }))[0]?.status, "COMPLETED");
  assert.equal((await listTimeEntries(companyId, project!._id.toString(), { branchId: branch._id })).length, 1);
  assert.equal((await listProjectExpenses(companyId, project!._id.toString(), { branchId: branch._id })).length, 1);

  await createCategory(ownerId.toString(), companyId, "Access");
  await upsertSlaPolicy(ownerId.toString(), companyId, { priority: "URGENT", targetMinutes: 30 });
  const ticket = await createTicket(ownerId.toString(), companyId, { branchId, title: "Login failure", description: "Unable to sign in", category: "Access", priority: "URGENT" });
  assert.ok(Math.abs(ticket.slaDueAt.getTime() - ticket.createdAt.getTime() - 30 * 60_000) < 5_000);
  await assignTicket(ownerId.toString(), companyId, ticket._id.toString(), memberId.toString(), { branchId: branch._id });
  await addTicketComment(memberId.toString(), companyId, ticket._id.toString(), "Investigating", { branchId: branch._id });
  await addTicketAttachment(memberId.toString(), companyId, ticket._id.toString(), { filename: "log.txt", storageKey: "tickets/log.txt", contentType: "text/plain", sizeBytes: 100 }, { branchId: branch._id });
  await changeTicketStatus(memberId.toString(), companyId, ticket._id.toString(), "IN_PROGRESS", { branchId: branch._id });
  await changeTicketStatus(memberId.toString(), companyId, ticket._id.toString(), "WAITING", { branchId: branch._id });
  await changeTicketStatus(memberId.toString(), companyId, ticket._id.toString(), "RESOLVED", { branchId: branch._id });
  await changeTicketStatus(ownerId.toString(), companyId, ticket._id.toString(), "CLOSED", { branchId: branch._id });
  await assert.rejects(changeTicketStatus(ownerId.toString(), companyId, ticket._id.toString(), "IN_PROGRESS", { branchId: branch._id }), { code: "INVALID_TICKET_TRANSITION" });
  assert.equal((await listTickets(companyId, { branchId: new Types.ObjectId() })).length, 0);
  const history = await listTicketHistory(companyId, ticket._id.toString(), { branchId: branch._id });
  assert.equal(history.filter((entry) => entry.action === "STATUS_CHANGED").length, 4);
  assert.ok(history.some((entry) => entry.action === "ASSIGNED"));
  assert.ok(history.some((entry) => entry.action === "COMMENT_ADDED"));
  assert.ok(history.some((entry) => entry.action === "ATTACHMENT_ADDED"));
  assert.equal((await TicketModel.findById(ticket._id))?.attachments.length, 1);
});
