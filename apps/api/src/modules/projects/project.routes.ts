import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { expenseSchema, memberSchema, milestoneSchema, projectSchema, taskSchema, timeEntrySchema } from "./project.validation.js";
import { addProjectMember, createMilestone, createProject, createProjectExpense, createTask, createTimeEntry, listMilestones, listProjectExpenses, listProjectMembers, listProjects, listTasks, listTimeEntries, updateMilestoneStatus } from "./project.service.js";
import { z } from "zod";
import { HttpError } from "../../middleware/errors.js";

const param = (value: string | string[] | undefined, label: string) => { if (!value || Array.isArray(value)) throw new HttpError(400, "INVALID_ROUTE_ID", `${label} invalido`); return value; };

export const createProjectRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.post("/", requirePermission("projects.create"), asyncHandler(async (req, res) => { const data = projectSchema.parse({ ...req.body, branchId: req.body.branchId ?? req.branchId }); const item = await createProject(req.auth!.id, req.companyId!, data); res.status(201).json({ success: true, data: item, message: "Proyecto creado" }); }));
  router.get("/", requirePermission("projects.read"), asyncHandler(async (req, res) => { const items = await listProjects(req.companyId!, branchFilterFor(req)); res.json({ success: true, data: items, message: "Proyectos obtenidos" }); }));
  router.post("/tasks", requirePermission("projects.create"), asyncHandler(async (req, res) => { const item = await createTask(req.auth!.id, req.companyId!, taskSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data: item, message: "Tarea creada" }); }));
  router.get("/tasks", requirePermission("projects.read"), asyncHandler(async (req, res) => { const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined; const items = await listTasks(req.companyId!, projectId, branchFilterFor(req)); res.json({ success: true, data: items, message: "Tareas obtenidas" }); }));
  router.post("/:projectId/members", requirePermission("projects.update"), asyncHandler(async (req, res) => { const item = await addProjectMember(req.auth!.id, req.companyId!, param(req.params.projectId, "Proyecto"), memberSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data: item, message: "Miembro agregado" }); }));
  router.get("/:projectId/members", requirePermission("projects.read"), asyncHandler(async (req, res) => { const data = await listProjectMembers(req.companyId!, param(req.params.projectId, "Proyecto"), branchFilterFor(req)); res.json({ success: true, data, message: "Miembros obtenidos" }); }));
  router.post("/:projectId/milestones", requirePermission("projects.create"), asyncHandler(async (req, res) => { const data = await createMilestone(req.auth!.id, req.companyId!, param(req.params.projectId, "Proyecto"), milestoneSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Hito creado" }); }));
  router.get("/:projectId/milestones", requirePermission("projects.read"), asyncHandler(async (req, res) => { const data = await listMilestones(req.companyId!, param(req.params.projectId, "Proyecto"), branchFilterFor(req)); res.json({ success: true, data, message: "Hitos obtenidos" }); }));
  router.patch("/:projectId/milestones/:milestoneId/status", requirePermission("projects.update"), asyncHandler(async (req, res) => { const body = z.object({ status: z.enum(["IN_PROGRESS", "COMPLETED"]) }).parse(req.body); const data = await updateMilestoneStatus(req.companyId!, param(req.params.projectId, "Proyecto"), param(req.params.milestoneId, "Hito"), body.status, branchFilterFor(req)); res.json({ success: true, data, message: "Estado del hito actualizado" }); }));
  router.post("/:projectId/time-entries", requirePermission("projects.create"), asyncHandler(async (req, res) => { const data = await createTimeEntry(req.auth!.id, req.companyId!, param(req.params.projectId, "Proyecto"), timeEntrySchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Tiempo registrado" }); }));
  router.get("/:projectId/time-entries", requirePermission("projects.read"), asyncHandler(async (req, res) => { const data = await listTimeEntries(req.companyId!, param(req.params.projectId, "Proyecto"), branchFilterFor(req)); res.json({ success: true, data, message: "Registros de tiempo obtenidos" }); }));
  router.post("/:projectId/expenses", requirePermission("projects.create"), asyncHandler(async (req, res) => { const data = await createProjectExpense(req.auth!.id, req.companyId!, param(req.params.projectId, "Proyecto"), expenseSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Gasto de proyecto registrado" }); }));
  router.get("/:projectId/expenses", requirePermission("projects.read"), asyncHandler(async (req, res) => { const data = await listProjectExpenses(req.companyId!, param(req.params.projectId, "Proyecto"), branchFilterFor(req)); res.json({ success: true, data, message: "Gastos obtenidos" }); }));
  return router;
};
