import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { hashPassword, verifyPassword } from "../src/modules/auth/auth.crypto.js";
import { signToken, verifyToken } from "../src/modules/auth/auth.tokens.js";
import type { Environment } from "../src/config/environment.js";

const environment: Environment = {
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
};

test("passwords are hashed and only the original password verifies", async () => {
  const hash = await hashPassword("correct-password");

  assert.notEqual(hash, "correct-password");
  assert.equal(await verifyPassword("correct-password", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("access tokens contain the expected identity claims", async () => {
  const token = await signToken({
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    roles: ["user"],
    permissions: ["profile:read"]
    ,memberships: []
  }, 0, "access", environment);
  const payload = await verifyToken(token, "access", environment);

  assert.equal(payload.sub, "user-1");
  assert.equal(payload.email, "user@example.com");
  assert.deepEqual(payload.permissions, ["profile:read"]);
});

test("registration rejects weak passwords before database access", async () => {
  const response = await request(createApp(environment)).post("/api/v1/auth/register").send({
    email: "user@example.com",
    name: "Test User",
    password: "short"
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.code, "VALIDATION_ERROR");
});

test("protected routes reject requests without a bearer token", async () => {
  const response = await request(createApp(environment)).get("/api/v1/auth/me");

  assert.equal(response.status, 401);
  assert.equal(response.body.code, "UNAUTHORIZED");
});