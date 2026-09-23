import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { activitySchema, opportunitySchema } from "../src/modules/crm/crm.validation.js";
import { projectSchema, taskSchema } from "../src/modules/projects/project.validation.js";
import { commentSchema, ticketSchema } from "../src/modules/helpdesk/helpdesk.validation.js";

test("CRM and project schemas enforce business constraints", () => {
  assert.equal(opportunitySchema.safeParse({ customerId: "c", name: "Deal", value: 10, assignedTo: "u" }).success, true);
  assert.equal(activitySchema.safeParse({ customerId: "c", type: "CALL", notes: "Follow up", occurredAt: "2026-09-23" }).success, true);
  assert.equal(projectSchema.safeParse({ name: "Project", managerId: "u", startDate: "2026-09-24", endDate: "2026-09-23" }).success, false);
  assert.equal(taskSchema.safeParse({ projectId: "p", title: "Task", assignedTo: "u", hours: -1 }).success, false);
});

test("Help Desk schemas validate ticket and comment content", () => {
  assert.equal(ticketSchema.safeParse({ title: "Login error", description: "Cannot log in", category: "Access" }).success, true);
  assert.equal(commentSchema.safeParse({ message: "Investigating" }).success, true);
  assert.equal(commentSchema.safeParse({ message: "" }).success, false);
});

test("CRM, project and Help Desk routes require authentication", async () => {
  const app = createApp({
    NODE_ENV: "test", API_PORT: 4000, API_HOST: "localhost", CORS_ORIGIN: "http://localhost:8081", LOG_LEVEL: "silent", MONGODB_URI: "",
    JWT_ACCESS_SECRET: "access-secret-used-only-by-tests-123456", JWT_REFRESH_SECRET: "refresh-secret-used-only-by-tests-123456", JWT_ACCESS_EXPIRES_IN: "15m", JWT_REFRESH_EXPIRES_IN: "7d"
  });
  const prefix = "/api/v1/companies/507f1f77bcf86cd799439011";
  for (const path of ["/crm/opportunities", "/projects", "/projects/tasks", "/helpdesk/tickets"]) {
    const response = await request(app).get(`${prefix}${path}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});