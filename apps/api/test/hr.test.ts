import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { attendanceSchema, departmentSchema, employeeDocumentSchema, employeeSchema, leaveSchema, leaveStatusSchema, positionSchema } from "../src/modules/hr/hr.validation.js";

test("HR schemas validate the minimum business rules", () => {
  assert.equal(departmentSchema.safeParse({ name: "Ventas", code: "SALES" }).success, true);
  assert.equal(employeeSchema.safeParse({ departmentId: "dept-1", userId: "user-1", firstName: "Ana", lastName: "García", email: "ana@demo.com", position: "Analyst", hireDate: "2026-01-10", status: "ACTIVE" }).success, true);
  assert.equal(leaveSchema.safeParse({ employeeId: "emp-1", type: "VACATION", startDate: "2026-09-15", endDate: "2026-09-16" }).success, true);
  assert.equal(leaveSchema.safeParse({ employeeId: "emp-1", type: "VACATION", startDate: "2026-09-20", endDate: "2026-09-15" }).success, false);
  assert.equal(positionSchema.safeParse({ title: "Analyst", code: "ANALYST" }).success, true);
  assert.equal(employeeDocumentSchema.safeParse({ name: "ID card", category: "IDENTITY", storageKey: "hr/1/id", contentType: "application/pdf", sizeBytes: 300 }).success, true);
  assert.equal(attendanceSchema.safeParse({ employeeId: "emp-1", date: "2026-09-24", checkIn: "2026-09-24T17:00:00Z", checkOut: "2026-09-24T16:00:00Z" }).success, false);
  assert.equal(leaveStatusSchema.safeParse({ status: "APPROVED" }).success, true);
});

test("HR routes require authentication", async () => {
  const app = createApp({
    NODE_ENV: "test",
    API_PORT: 4000,
    API_HOST: "localhost",
    CORS_ORIGIN: "http://localhost:8081",
    LOG_LEVEL: "silent",
    MONGODB_URI: "",
    JWT_ACCESS_SECRET: "access-secret-used-only-by-tests-123456",
    JWT_REFRESH_SECRET: "refresh-secret-used-only-by-tests-123456",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d"
  });

  const prefix = "/api/v1/companies/507f1f77bcf86cd799439011";
  for (const path of ["/hr/departments", "/hr/positions", "/hr/employees", "/hr/contracts", "/hr/attendance", "/hr/leaves", "/hr/employees/507f1f77bcf86cd799439011/documents"]) {
    const response = await request(app).get(`${prefix}${path}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
