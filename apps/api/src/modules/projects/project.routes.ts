import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { projectSchema, taskSchema } from "./project.validation.js";
import { createProject, createTask, listProjects, listTasks } from "./project.service.js";

export const createProjectRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.post("/", asyncHandler(async (req, res) => { const item = await createProject(req.auth!.id, req.companyId!, projectSchema.parse(req.body)); res.status(201).json({ success: true, data: item, message: "Proyecto creado" }); }));
  router.get("/", asyncHandler(async (req, res) => { const items = await listProjects(req.companyId!); res.json({ success: true, data: items, message: "Proyectos obtenidos" }); }));
  router.post("/tasks", asyncHandler(async (req, res) => { const item = await createTask(req.auth!.id, req.companyId!, taskSchema.parse(req.body)); res.status(201).json({ success: true, data: item, message: "Tarea creada" }); }));
  router.get("/tasks", asyncHandler(async (req, res) => { const items = await listTasks(req.companyId!); res.json({ success: true, data: items, message: "Tareas obtenidas" }); }));
  return router;
};