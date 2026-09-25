import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { HttpError } from "../../middleware/errors.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { branchFilterFor, requireCompanyContext } from "../../middleware/tenant.js";
import { attendanceSchema, contractSchema, departmentSchema, employeeDocumentSchema, employeeSchema, leaveSchema, leaveStatusSchema, positionSchema } from "./hr.validation.js";
import { createAttendance, createContract, createDepartment, createEmployee, createEmployeeDocument, createLeave, createPosition, listAttendance, listContracts, listDepartments, listEmployees, listEmployeeDocuments, listLeaves, listPositions, updateLeaveStatus } from "./hr.service.js";

const routeId = (value: string | string[] | undefined, label: string) => { if (!value || Array.isArray(value)) throw new HttpError(400, "INVALID_ROUTE_ID", `${label} invalido`); return value; };
export const createHrRouter = () => {
  const router = Router({ mergeParams: true }); router.use(requireAuth, requireCompanyContext);
  router.post("/departments", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createDepartment(req.auth!.id, req.companyId!, departmentSchema.parse(req.body)); res.status(201).json({ success: true, data, message: "Departamento creado" }); }));
  router.get("/departments", requirePermission("hr.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listDepartments(req.companyId!), message: "Departamentos obtenidos" }); }));
  router.post("/positions", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createPosition(req.auth!.id, req.companyId!, positionSchema.parse(req.body)); res.status(201).json({ success: true, data, message: "Puesto creado" }); }));
  router.get("/positions", requirePermission("hr.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listPositions(req.companyId!), message: "Puestos obtenidos" }); }));
  router.post("/employees", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createEmployee(req.auth!.id, req.companyId!, { ...employeeSchema.parse(req.body), branchId: req.branchId ?? req.body.branchId }); res.status(201).json({ success: true, data, message: "Empleado creado" }); }));
  router.get("/employees", requirePermission("hr.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listEmployees(req.companyId!, branchFilterFor(req)), message: "Empleados obtenidos" }); }));
  router.post("/employees/:employeeId/documents", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createEmployeeDocument(req.auth!.id, req.companyId!, routeId(req.params.employeeId, "Empleado"), employeeDocumentSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Metadata del documento registrada" }); }));
  router.get("/employees/:employeeId/documents", requirePermission("hr.read"), asyncHandler(async (req, res) => { const data = await listEmployeeDocuments(req.companyId!, routeId(req.params.employeeId, "Empleado"), branchFilterFor(req)); res.json({ success: true, data, message: "Documentos obtenidos" }); }));
  router.post("/contracts", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createContract(req.auth!.id, req.companyId!, contractSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Contrato creado" }); }));
  router.get("/contracts", requirePermission("hr.compensation.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listContracts(req.companyId!, branchFilterFor(req)), message: "Contratos obtenidos" }); }));
  router.post("/attendance", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createAttendance(req.auth!.id, req.companyId!, attendanceSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Asistencia registrada" }); }));
  router.get("/attendance", requirePermission("hr.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listAttendance(req.companyId!, branchFilterFor(req)), message: "Asistencia obtenida" }); }));
  router.post("/leaves", requirePermission("hr.create"), asyncHandler(async (req, res) => { const data = await createLeave(req.auth!.id, req.companyId!, leaveSchema.parse(req.body), branchFilterFor(req)); res.status(201).json({ success: true, data, message: "Solicitud de permiso creada" }); }));
  router.get("/leaves", requirePermission("hr.read"), asyncHandler(async (req, res) => { res.json({ success: true, data: await listLeaves(req.companyId!, branchFilterFor(req)), message: "Permisos obtenidos" }); }));
  router.patch("/leaves/:leaveId/status", requirePermission("hr.update"), asyncHandler(async (req, res) => { const data = await updateLeaveStatus(req.auth!.id, req.companyId!, routeId(req.params.leaveId, "Permiso"), leaveStatusSchema.parse(req.body).status, branchFilterFor(req)); res.json({ success: true, data, message: "Estado de permiso actualizado" }); }));
  return router;
};
