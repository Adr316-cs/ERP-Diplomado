import pino from "pino";
import { loadEnvironment } from "../config/environment.js";

const environment = loadEnvironment();

export const logger = pino({
  level: environment.LOG_LEVEL,
  base: { service: "erp-api" },
  redact: ["req.headers.authorization", "req.headers.cookie"]
});