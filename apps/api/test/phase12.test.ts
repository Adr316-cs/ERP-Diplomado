import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { reportQuerySchema } from "../src/modules/reports/report.validation.js";

test("report query schema validates optional branchId and date range", () => {
  const valid = { from: "2026-09-01", to: "2026-09-30", branchId: "507f1f77bcf86cd799439011" };
  const invalid = { from: "2026-09-30", to: "2026-09-01", branchId: "not-a-valid-id" };
  assert.equal(reportQuerySchema.safeParse(valid).success, true);
  assert.equal(reportQuerySchema.safeParse(invalid).success, false);
});

test("report routes require authentication", async () => {
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
  for (const path of ["/reports/dashboard", "/reports/sales"]) {
    const response = await request(app).get(`${prefix}${path}?branchId=507f1f77bcf86cd799439011`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});
