import { Router } from "express";
import { loadEnvironment, type Environment } from "../../config/environment.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validation.js";
import { getCurrentUser, login, logout, refresh, register } from "./auth.service.js";

export const createAuthRouter = (environment: Environment = loadEnvironment()) => {
  const router = Router();

  router.post("/register", asyncHandler(async (request, response) => {
    const input = registerSchema.parse(request.body);
    const result = await register(input, environment);
    response.status(201).json({ success: true, data: result, message: "Usuario registrado" });
  }));

  router.post("/login", asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body);
    const result = await login(input, environment);
    response.status(200).json({ success: true, data: result, message: "Inicio de sesión correcto" });
  }));

  router.post("/refresh", asyncHandler(async (request, response) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    const result = await refresh(refreshToken, environment);
    response.status(200).json({ success: true, data: result, message: "Token renovado" });
  }));

  router.post("/logout", requireAuth, asyncHandler(async (request, response) => {
    await logout(request.auth!.id);
    response.status(200).json({ success: true, data: null, message: "Sesión cerrada" });
  }));

  router.get("/me", requireAuth, asyncHandler(async (request, response) => {
    const user = await getCurrentUser(request.auth!.id);
    response.status(200).json({ success: true, data: user, message: "Usuario autenticado" });
  }));

  return router;
};