import { Router } from "express";
import { HttpError } from "../../middleware/errors.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireCompanyContext } from "../../middleware/tenant.js";
import { attendanceSchema, contractSchema, departmentSchema, employeeSchema, leaveSchema } from "./hr.validation.js";
import { createAttendance, createContract, createDepartment, createEmployee, createLeave, listAttendance, listContracts, listDepartments, listEmployees, listLeaves } from "./hr.service.js";

export const createHrRouter = () => {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireCompanyContext);

  router.post("/departments", asyncHandler(async (request, response) => {
    const item = await createDepartment(request.auth!.id, request.companyId!, departmentSchema.parse(request.body));
    response.status(201).json({ success: true, data: item, message: "Departamento creado" });
  }));

  router.get("/departments", asyncHandler(async (request, response) => {
    const items = await listDepartments(request.companyId!);
    response.json({ success: true, data: items, message: "Departamentos obtenidos" });
  }));

  router.post("/employees", asyncHandler(async (request, response) => {
    const item = await createEmployee(request.auth!.id, request.companyId!, employeeSchema.parse(request.body));
    response.status(201).json({ success: true, data: item, message: "Empleado creado" });
  }));

  router.get("/employees", asyncHandler(async (request, response) => {
    const items = await listEmployees(request.companyId!);
    response.json({ success: true, data: items, message: "Empleados obtenidos" });
  }));

  router.post("/contracts", asyncHandler(async (request, response) => {
    const item = await createContract(request.auth!.id, request.companyId!, contractSchema.parse(request.body));
    response.status(201).json({ success: true, data: item, message: "Contrato creado" });
  }));

  router.get("/contracts", asyncHandler(async (request, response) => {
    const items = await listContracts(request.companyId!);
    response.json({ success: true, data: items, message: "Contratos obtenidos" });
  }));

  router.post("/attendance", asyncHandler(async (request, response) => {
    const item = await createAttendance(request.auth!.id, request.companyId!, attendanceSchema.parse(request.body));
    response.status(201).json({ success: true, data: item, message: "Asistencia registrada" });
  }));

  router.get("/attendance", asyncHandler(async (request, response) => {
    const items = await listAttendance(request.companyId!);
    response.json({ success: true, data: items, message: "Asistencia obtenida" });
  }));

  router.post("/leaves", asyncHandler(async (request, response) => {
    const item = await createLeave(request.auth!.id, request.companyId!, leaveSchema.parse(request.body));
    response.status(201).json({ success: true, data: item, message: "Permiso registrado" });
  }));

  router.get("/leaves", asyncHandler(async (request, response) => {
    const items = await listLeaves(request.companyId!);
    response.json({ success: true, data: items, message: "Permisos obtenidos" });
  }));

  return router;
};
