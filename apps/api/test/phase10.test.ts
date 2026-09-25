import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { activitySchema, interactionSchema, leadSchema, opportunitySchema } from "../src/modules/crm/crm.validation.js";
import { expenseSchema, memberSchema, milestoneSchema, projectSchema, taskSchema, timeEntrySchema } from "../src/modules/projects/project.validation.js";
import { assignmentSchema, attachmentSchema, categorySchema, commentSchema, slaPolicySchema, ticketSchema, ticketStatusSchema } from "../src/modules/helpdesk/helpdesk.validation.js";

test("CRM and project schemas enforce business constraints", () => {
  assert.equal(opportunitySchema.safeParse({ customerId: "c", name: "Deal", value: 10, assignedTo: "u" }).success, true);
  assert.equal(opportunitySchema.safeParse({ customerId: "c", leadId: "l", name: "Deal", value: 10, assignedTo: "u" }).success, false);
  assert.equal(leadSchema.safeParse({ name: "Lead", assignedTo: "u" }).success, true);
  assert.equal(activitySchema.safeParse({ customerId: "c", type: "CALL", notes: "Follow up", occurredAt: "2026-09-23" }).success, true);
  assert.equal(activitySchema.safeParse({ type: "CALL", notes: "Follow up", occurredAt: "2026-09-23" }).success, false);
  assert.equal(interactionSchema.safeParse({ leadId: "l", type: "EMAIL", subject: "Intro", summary: "Sent email", occurredAt: "2026-09-23" }).success, true);
  assert.equal(projectSchema.safeParse({ name: "Project", managerId: "u", startDate: "2026-09-24", endDate: "2026-09-23" }).success, false);
  assert.equal(taskSchema.safeParse({ projectId: "p", title: "Task", assignedTo: "u", hours: -1 }).success, false);
  assert.equal(memberSchema.safeParse({ userId: "u" }).success, true);
  assert.equal(milestoneSchema.safeParse({ name: "Launch", dueDate: "2026-10-01" }).success, true);
  assert.equal(timeEntrySchema.safeParse({ workDate: "2026-09-24", minutes: 90, description: "Planning" }).success, true);
  assert.equal(expenseSchema.safeParse({ description: "Travel", amount: 1, spentAt: "2026-09-24" }).success, true);
});

test("Help Desk schemas validate ticket and comment content", () => {
  assert.equal(ticketSchema.safeParse({ title: "Login error", description: "Cannot log in", category: "Access" }).success, true);
  assert.equal(commentSchema.safeParse({ message: "Investigating" }).success, true);
  assert.equal(commentSchema.safeParse({ message: "" }).success, false);
  assert.equal(ticketStatusSchema.safeParse({ status: "WAITING" }).success, true);
  assert.equal(ticketStatusSchema.safeParse({ status: "OPEN" }).success, false);
  assert.equal(assignmentSchema.safeParse({ assignedTo: null }).success, true);
  assert.equal(attachmentSchema.safeParse({ filename: "log.txt", storageKey: "tickets/1/log.txt", contentType: "text/plain", sizeBytes: 10 }).success, true);
  assert.equal(categorySchema.safeParse({ name: "Access" }).success, true);
  assert.equal(slaPolicySchema.safeParse({ priority: "URGENT", targetMinutes: 30 }).success, true);
});

test("CRM, project and Help Desk routes require authentication", async () => {
  const app = createApp({
    NODE_ENV: "test", API_PORT: 4000, API_HOST: "localhost", CORS_ORIGIN: "http://localhost:8081", LOG_LEVEL: "silent", MONGODB_URI: "",
    JWT_ACCESS_SECRET: "access-secret-used-only-by-tests-123456", JWT_REFRESH_SECRET: "refresh-secret-used-only-by-tests-123456", JWT_ACCESS_EXPIRES_IN: "15m", JWT_REFRESH_EXPIRES_IN: "7d"
  });
  const prefix = "/api/v1/companies/507f1f77bcf86cd799439011";
  for (const path of ["/crm/leads", "/crm/opportunities", "/crm/contacts", "/crm/interactions", "/crm/customers/507f1f77bcf86cd799439011/history", "/projects", "/projects/tasks", "/projects/507f1f77bcf86cd799439011/members", "/projects/507f1f77bcf86cd799439011/milestones", "/projects/507f1f77bcf86cd799439011/time-entries", "/projects/507f1f77bcf86cd799439011/expenses", "/helpdesk/tickets", "/helpdesk/categories", "/helpdesk/sla"]) {
    const response = await request(app).get(`${prefix}${path}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
