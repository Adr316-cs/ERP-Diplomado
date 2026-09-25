import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { errorHandler } from "../src/middleware/errors.js";

test("Mongo duplicate-key errors become conflict responses without exposing index data", () => {
  let statusCode = 0;
  let payload: unknown;
  const response = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { payload = body; return this; }
  } as unknown as Response;
  errorHandler({ code: 11000, keyValue: { email: "private@example.com" } }, {} as Request, response, (() => undefined) as never);
  assert.equal(statusCode, 409);
  assert.deepEqual(payload, { success: false, message: "Ya existe un recurso con esos valores únicos", code: "DUPLICATE_RESOURCE" });
});
