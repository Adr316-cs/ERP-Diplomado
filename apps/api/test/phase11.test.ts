import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { reportQuerySchema } from "../src/modules/reports/report.validation.js";

test("report date filters require a valid range", () => {
  assert.equal(reportQuerySchema.safeParse({ from: "2026-09-01", to: "2026-09-30" }).success, true);
  assert.equal(reportQuerySchema.safeParse({ from: "2026-09-30", to: "2026-09-01" }).success, false);
});

test("audit, notification and report routes require authentication", async () => {
  const app = createApp({
    NODE_ENV: "test", API_PORT: 4000, API_HOST: "localhost", CORS_ORIGIN: "http://localhost:8081", LOG_LEVEL: "silent", MONGODB_URI: "",
    JWT_ACCESS_SECRET: "access-secret-used-only-by-tests-123456", JWT_REFRESH_SECRET: "refresh-secret-used-only-by-tests-123456", JWT_ACCESS_EXPIRES_IN: "15m", JWT_REFRESH_EXPIRES_IN: "7d"
  });
  const prefix = "/api/v1/companies/507f1f77bcf86cd799439011";
  for (const path of ["/audit", "/notifications", "/reports/dashboard", "/reports/sales"]) {
    const response = await request(app).get(`${prefix}${path}`);
    assert.equal(response.status, 401);
    assert.equal(response.body.code, "UNAUTHORIZED");
  }
});