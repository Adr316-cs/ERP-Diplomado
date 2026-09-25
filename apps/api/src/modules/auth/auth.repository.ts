import { RoleModel, UserCompanyModel, UserModel, UserRoleModel } from "./auth.model.js";
import { Types } from "mongoose";
import { ensureAuthorizationSeeded } from "./authorization.js";

export const findUserByEmail = (email: string) => UserModel.findOne({ email }).select("+passwordHash").populate({
  path: "roles",
  populate: { path: "permissions" }
});

export const findUserById = (id: string) => UserModel.findById(id).populate({
  path: "roles",
  populate: { path: "permissions" }
});

export const createUser = async (input: { email: string; name: string; passwordHash: string }) => {
  await ensureAuthorizationSeeded();
  const defaultRole = await RoleModel.findOne({ name: "EMPLOYEE" });
  if (!defaultRole) throw new Error("No se pudo inicializar el rol EMPLOYEE");
  return UserModel.create({ ...input, roles: [defaultRole._id] });
};

export const incrementTokenVersion = (id: string) =>
  UserModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }, { new: true });

export const addMembership = async (userId: string, companyId: string, isOwner: boolean, branchId?: string) => {
  if (branchId) {
    await findUserCompanies(userId);
    const session = await UserCompanyModel.db.startSession();
    try {
      await session.withTransaction(async () => {
        const companyResult = await UserCompanyModel.updateOne({ userId, companyId }, { $addToSet: { branchIds: branchId } }, { session });
        const userResult = await UserModel.updateOne({ _id: userId, "memberships.companyId": companyId }, { $addToSet: { "memberships.$.branchIds": branchId } }, { session });
        if (companyResult.matchedCount === 0 || userResult.matchedCount === 0) throw new Error("No se pudo actualizar la membresía");
      });
    } finally { await session.endSession(); }
    return;
  }  const session = await UserCompanyModel.db.startSession();
  try {
    await session.withTransaction(async () => {
      await UserCompanyModel.updateOne({ userId, companyId }, { $setOnInsert: { branchIds: [], isOwner, assignedBy: userId } }, { upsert: true, session });
      await UserModel.updateOne({ _id: userId }, { $addToSet: { memberships: { companyId, branchIds: [], isOwner } } }, { session });
    });
  } finally { await session.endSession(); }
};

export const findUserCompanies = async (userId: string) => {
  const userObjectId = new Types.ObjectId(userId);
  let memberships = await UserCompanyModel.find({ userId: userObjectId }).lean();
  const legacyUser = await UserModel.findById(userObjectId).select("memberships").lean();
  const existingCompanies = new Set(memberships.map((membership) => membership.companyId.toString()));
  const missingMemberships = (legacyUser?.memberships ?? []).filter((membership) => !existingCompanies.has(membership.companyId.toString()));
  if (missingMemberships.length) {
    await UserCompanyModel.bulkWrite(missingMemberships.map((membership) => ({
      updateOne: {
        filter: { userId: userObjectId, companyId: membership.companyId },
        update: { $setOnInsert: { branchIds: membership.branchIds, isOwner: membership.isOwner, assignedBy: userObjectId } },
        upsert: true
      }
    })));
    memberships = await UserCompanyModel.find({ userId: userObjectId }).lean();
  }
  return memberships;
};
export const findCompanyMembership = async (userId: string, companyId: string) => {
  const membership = await UserCompanyModel.findOne({ userId, companyId }).lean();
  if (membership) return membership;
  const legacyUser = await UserModel.findOne({ _id: userId, "memberships.companyId": companyId }).select("memberships").lean();
  return legacyUser?.memberships.find((item) => item.companyId.toString() === companyId) ?? null;
};
export const rotateTokenVersion = (id: string, expectedVersion: number) => UserModel.findOneAndUpdate({ _id: id, tokenVersion: expectedVersion, isActive: true }, { $inc: { tokenVersion: 1 } }, { new: true }).populate({ path: "roles", populate: { path: "permissions" } });


export const replaceCompanyRoles = async (userId: string, companyId: string, roleNames: string[], assignedBy: string) => {
  await ensureAuthorizationSeeded();
  const roles = await RoleModel.find({ name: { $in: roleNames } });
  if (roles.length !== new Set(roleNames).size) throw new Error("Uno o más roles no existen");
  const session = await UserRoleModel.db.startSession();
  try {
    await session.withTransaction(async () => {
      await UserRoleModel.deleteMany({ userId, companyId }, { session });
      if (roles.length > 0) {
        await UserRoleModel.insertMany(roles.map((role) => ({ userId, companyId, roleId: role._id, assignedBy })), { session });
      }
    });
  } finally {
    await session.endSession();
  }
};

export const createCompanyMembership = async (input: { userId: string; companyId: string; branchIds: string[]; roleNames: string[]; assignedBy: string }) => {
  await ensureAuthorizationSeeded();
  const roles = await RoleModel.find({ name: { $in: input.roleNames } });
  if (roles.length !== new Set(input.roleNames).size) throw new Error("Uno o más roles no existen");
  const session = await UserCompanyModel.db.startSession();
  try {
    await session.withTransaction(async () => {
      if (await UserCompanyModel.exists({ userId: input.userId, companyId: input.companyId }).session(session)) {
        throw new Error("Usuario no disponible o ya pertenece a la empresa");
      }
      await UserCompanyModel.create([{ userId: input.userId, companyId: input.companyId, branchIds: input.branchIds, isOwner: false, assignedBy: input.assignedBy }], { session });
      const result = await UserModel.updateOne(
        { _id: input.userId, "memberships.companyId": { $ne: new Types.ObjectId(input.companyId) } },
        { $push: { memberships: { companyId: input.companyId, branchIds: input.branchIds, isOwner: false } } },
        { session }
      );
      if (result.matchedCount === 0) throw new Error("Usuario no disponible o ya pertenece a la empresa");
      if (roles.length) await UserRoleModel.insertMany(roles.map((role) => ({ userId: input.userId, companyId: input.companyId, roleId: role._id, assignedBy: input.assignedBy })), { session });
    });
  } finally { await session.endSession(); }
};
export const listCompanyUsersFromStore = async (companyId: string) => {
  const companyObjectId = new Types.ObjectId(companyId);
  const legacyUsers = await UserModel.find({ "memberships.companyId": companyObjectId }).select("_id memberships").lean();
  for (const legacyUser of legacyUsers) {
    const membership = legacyUser.memberships.find((item) => item.companyId.toString() === companyId);
    if (membership) await UserCompanyModel.updateOne(
      { userId: legacyUser._id, companyId: companyObjectId },
      { $setOnInsert: { branchIds: membership.branchIds, isOwner: membership.isOwner, assignedBy: legacyUser._id } },
      { upsert: true }
    );
  }
  const memberships = await UserCompanyModel.find({ companyId: companyObjectId }).lean();
  const users = await UserModel.find({ _id: { $in: memberships.map((membership) => membership.userId) } }).select("name email isActive").sort({ name: 1 }).lean();
  const assignments = await UserRoleModel.find({ companyId: companyObjectId }).populate("roleId").lean() as unknown as Array<{ userId: Types.ObjectId; roleId: { name: string } }>;
  return users.map((user) => {
    const membership = memberships.find((item) => item.userId.toString() === user._id.toString());
    const userRoles = assignments.filter((item) => item.userId.toString() === user._id.toString()).map((item) => item.roleId.name);
    return { id: user._id.toString(), name: user.name, email: user.email, isActive: user.isActive, branchIds: membership?.branchIds.map((id) => id.toString()) ?? [], isOwner: membership?.isOwner ?? false, roles: userRoles };
  });
};



