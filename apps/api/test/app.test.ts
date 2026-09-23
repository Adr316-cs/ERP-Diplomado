import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";

test("health endpoint returns the API status", async () => {
  const response = await request(createApp()).get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, "ok");
});

test("readiness reports development without a database as ready", async () => {
  const response = await request(createApp({
    NODE_ENV: "test",
    API_PORT: 4000,
    API_HOST: "localhost",
    CORS_ORIGIN: "http://localhost:8081",
    LOG_LEVEL: "silent",
    MONGODB_URI: ""
  })).get("/api/v1/health/ready");

  assert.equal(response.status, 200);
  assert.equal(response.body.data.status, "ready");
  assert.equal(response.body.data.database, "disabled");
});

test("unknown routes return a consistent not found response", async () => {
  const response = await request(createApp()).get("/api/v1/unknown");

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "NOT_FOUND");
});