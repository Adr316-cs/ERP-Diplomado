import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../observability/logger.js";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      success: false,
      message: "JSON inválido",
      code: "INVALID_JSON"
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(422).json({
      success: false,
      message: "Datos de entrada inválidos",
      code: "VALIDATION_ERROR",
      details: error.issues.map(({ path, message }) => ({ path, message }))
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
    return;
  }

  logger.error({ err: error }, "Error no controlado");
  response.status(500).json({
    success: false,
    message: "Error interno del servidor",
    code: "INTERNAL_ERROR"
  });
};