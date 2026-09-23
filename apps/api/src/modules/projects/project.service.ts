import { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { ProjectModel, TaskModel } from "./project.model.js";

const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} inválido`); };

export const createProject = async (userId: string, companyId: string, input: { name: string; description?: string | undefined; managerId: string; startDate?: Date | undefined; endDate?: Date | undefined }) => { databaseRequired(); assertId(input.managerId, "INVALID_MANAGER_ID", "Responsable"); return ProjectModel.create({ ...input, companyId, managerId: input.managerId, createdBy: userId }); };
export const listProjects = async (companyId: string) => { databaseRequired(); return ProjectModel.find({ companyId }).sort({ createdAt: -1 }); };
export const createTask = async (userId: string, companyId: string, input: { projectId: string; title: string; description?: string | undefined; assignedTo: string; dueDate?: Date | undefined; hours: number }) => { databaseRequired(); assertId(input.projectId, "INVALID_PROJECT_ID", "Proyecto"); assertId(input.assignedTo, "INVALID_ASSIGNED_USER", "Usuario asignado"); if (!await ProjectModel.exists({ _id: input.projectId, companyId })) throw new HttpError(400, "PROJECT_COMPANY_MISMATCH", "El proyecto no pertenece a la empresa"); return TaskModel.create({ ...input, companyId, createdBy: userId }); };
export const listTasks = async (companyId: string, projectId?: string) => { databaseRequired(); const filter = projectId ? { companyId, projectId } : { companyId }; return TaskModel.find(filter).sort({ createdAt: -1 }); };