import type { RequestHandler } from "express";
import { loadEnvironment } from "../config/environment.js";
import { HttpError } from "./errors.js";
import { verifyToken } from "../modules/auth/auth.tokens.js";
import { getCurrentUser } from "../modules/auth/auth.service.js";
import type { AuthUser } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    next(new HttpError(401, "UNAUTHORIZED", "Autenticación requerida"));
    return;
  }

  try {
    const payload = await verifyToken(authorization.slice(7), "access", loadEnvironment());
    const user = await getCurrentUser(payload.sub, payload.tokenVersion);
    if (user.email !== payload.email || user.roles.some((role) => !payload.roles.includes(role))) {
      throw new Error("Token desactualizado");
    }
    request.auth = user;
    next();
  } catch {
    next(new HttpError(401, "UNAUTHORIZED", "Token inválido o expirado"));
  }
};

export const requirePermission = (permission: string): RequestHandler => (request, _response, next) => {
  if (!request.auth?.permissions.includes(permission)) {
    next(new HttpError(403, "FORBIDDEN", "No tienes permisos para realizar esta operación"));
    return;
  }
  next();
};