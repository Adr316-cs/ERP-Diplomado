import mongoose, { Types } from "mongoose";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { UserCompanyModel } from "../auth/auth.model.js";
import { BranchModel } from "../branches/branch.model.js";
import { MilestoneModel, ProjectExpenseModel, ProjectMemberModel, ProjectModel, TaskModel, TimeEntryModel } from "./project.model.js";

type Filter = Record<string, unknown>;
const databaseRequired = () => { if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no esta disponible"); };
const assertId = (value: string, code: string, label: string) => { if (!Types.ObjectId.isValid(value)) throw new HttpError(400, code, `${label} invalido`); };
const validateUser = async (companyId: string, userId: string, branchId?: Types.ObjectId | string) => {
  assertId(userId, "INVALID_ASSIGNED_USER", "Usuario asignado");
  const filter: Filter = { companyId, userId };
  if (branchId) filter.$or = [{ isOwner: true }, { branchIds: new Types.ObjectId(branchId.toString()) }];
  if (!await UserCompanyModel.exists(filter)) throw new HttpError(400, "USER_COMPANY_MISMATCH", "El usuario no pertenece a la empresa o sucursal");
};
const findProject = async (companyId: string, projectId: string, branchFilter: Filter = {}) => {
  assertId(projectId, "INVALID_PROJECT_ID", "Proyecto");
  const project = await ProjectModel.findOne({ _id: projectId, companyId, ...branchFilter });
  if (!project) throw new HttpError(404, "PROJECT_NOT_FOUND", "Proyecto no encontrado");
  return project;
};

export const createProject = async (userId: string, companyId: string, input: { branchId?: string | undefined; name: string; description?: string | undefined; managerId: string; startDate?: Date | undefined; endDate?: Date | undefined }) => {
  databaseRequired();
  if (input.startDate && input.endDate && input.endDate < input.startDate) throw new HttpError(400, "INVALID_PROJECT_DATES", "La fecha final precede a la inicial");
  if (input.branchId) {
    assertId(input.branchId, "INVALID_BRANCH_ID", "Sucursal");
    if (!await BranchModel.exists({ _id: input.branchId, companyId, isActive: true })) throw new HttpError(400, "BRANCH_COMPANY_MISMATCH", "La sucursal no pertenece a la empresa");
  }
  await validateUser(companyId, input.managerId, input.branchId);
  const session = await mongoose.startSession();
  try {
    let project;
    await session.withTransaction(async () => {
      const created = await ProjectModel.create([{ ...input, companyId, managerId: input.managerId, createdBy: userId }], { session });
      project = created[0];
      await ProjectMemberModel.create([{ companyId, projectId: project!._id, userId: input.managerId, role: "MANAGER", addedBy: userId }], { session });
    });
    return project;
  } finally { await session.endSession(); }
};
export const listProjects = async (companyId: string, branchFilter: Filter = {}) => { databaseRequired(); return ProjectModel.find({ companyId, ...branchFilter }).sort({ createdAt: -1 }); };
export const createTask = async (userId: string, companyId: string, input: { projectId: string; title: string; description?: string | undefined; assignedTo: string; dueDate?: Date | undefined; hours: number }, branchFilter: Filter = {}) => {
  databaseRequired();
  const project = await findProject(companyId, input.projectId, branchFilter);
  await validateUser(companyId, input.assignedTo, project.branchId?.toString());
  return TaskModel.create({ ...input, companyId, createdBy: userId });
};
export const listTasks = async (companyId: string, projectId?: string, branchFilter: Filter = {}) => {
  databaseRequired();
  if (projectId) { await findProject(companyId, projectId, branchFilter); return TaskModel.find({ companyId, projectId }).sort({ createdAt: -1 }); }
  const projects = await ProjectModel.find({ companyId, ...branchFilter }).distinct("_id");
  return TaskModel.find({ companyId, projectId: { $in: projects } }).sort({ createdAt: -1 });
};
export const addProjectMember = async (userId: string, companyId: string, projectId: string, member: { userId: string; role: "MANAGER" | "MEMBER" }, branchFilter: Filter = {}) => {
  databaseRequired();
  const project = await findProject(companyId, projectId, branchFilter);
  await validateUser(companyId, member.userId, project.branchId?.toString());
  return ProjectMemberModel.create({ companyId, projectId, ...member, addedBy: userId });
};
export const listProjectMembers = async (companyId: string, projectId: string, branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter);
  return ProjectMemberModel.find({ companyId, projectId }).populate("userId", "name email").sort({ createdAt: 1 });
};
export const createMilestone = async (userId: string, companyId: string, projectId: string, input: { name: string; description?: string | undefined; dueDate: Date }, branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter);
  return MilestoneModel.create({ ...input, companyId, projectId, createdBy: userId });
};
export const listMilestones = async (companyId: string, projectId: string, branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter);
  return MilestoneModel.find({ companyId, projectId }).sort({ dueDate: 1 });
};
export const updateMilestoneStatus = async (companyId: string, projectId: string, milestoneId: string, status: "IN_PROGRESS" | "COMPLETED", branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter); assertId(milestoneId, "INVALID_MILESTONE_ID", "Hito");
  const milestone = await MilestoneModel.findOneAndUpdate({ _id: milestoneId, companyId, projectId }, { $set: { status } }, { new: true });
  if (!milestone) throw new HttpError(404, "MILESTONE_NOT_FOUND", "Hito no encontrado");
  return milestone;
};
export const createTimeEntry = async (userId: string, companyId: string, projectId: string, input: { taskId?: string | undefined; workDate: Date; minutes: number; description: string }, branchFilter: Filter = {}) => {
  databaseRequired(); const project = await findProject(companyId, projectId, branchFilter); await validateUser(companyId, userId, project.branchId?.toString());
  const session = await mongoose.startSession();
  try {
    let entry;
    await session.withTransaction(async () => {
      if (input.taskId) {
        assertId(input.taskId, "INVALID_TASK_ID", "Tarea");
        const task = await TaskModel.findOne({ _id: input.taskId, companyId, projectId }).session(session);
        if (!task) throw new HttpError(400, "TASK_PROJECT_MISMATCH", "La tarea no pertenece al proyecto");
        task.hours = Number((task.hours + input.minutes / 60).toFixed(2));
        await task.save({ session });
      }
      const created = await TimeEntryModel.create([{ ...input, companyId, projectId, userId, createdBy: userId }], { session });
      entry = created[0];
    });
    return entry;
  } finally { await session.endSession(); }
};
export const listTimeEntries = async (companyId: string, projectId: string, branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter);
  return TimeEntryModel.find({ companyId, projectId }).populate("userId", "name email").populate("taskId", "title").sort({ workDate: -1 });
};
export const createProjectExpense = async (userId: string, companyId: string, projectId: string, input: { description: string; amount: number; currency: string; spentAt: Date }, branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter);
  return ProjectExpenseModel.create({ ...input, companyId, projectId, createdBy: userId });
};
export const listProjectExpenses = async (companyId: string, projectId: string, branchFilter: Filter = {}) => {
  databaseRequired(); await findProject(companyId, projectId, branchFilter);
  return ProjectExpenseModel.find({ companyId, projectId }).sort({ spentAt: -1 });
};
