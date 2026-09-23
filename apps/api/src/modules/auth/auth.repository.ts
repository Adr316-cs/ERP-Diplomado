import { RoleModel, UserModel } from "./auth.model.js";

export const findUserByEmail = (email: string) => UserModel.findOne({ email }).select("+passwordHash").populate({
  path: "roles",
  populate: { path: "permissions" }
});

export const findUserById = (id: string) => UserModel.findById(id).populate({
  path: "roles",
  populate: { path: "permissions" }
});

export const createUser = async (input: { email: string; name: string; passwordHash: string }) => {
  const defaultRole = await RoleModel.findOneAndUpdate(
    { name: "user" },
    { $setOnInsert: { name: "user", permissions: [] } },
    { upsert: true, new: true }
  );

  return UserModel.create({ ...input, roles: [defaultRole._id] });
};

export const incrementTokenVersion = (id: string) =>
  UserModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }, { new: true });

export const addMembership = async (userId: string, companyId: string, isOwner: boolean, branchId?: string) => {
  const update = branchId
    ? { $addToSet: { "memberships.$.branchIds": branchId } }
    : { $addToSet: { memberships: { companyId, branchIds: [], isOwner } } };
  const filter = branchId ? { _id: userId, "memberships.companyId": companyId } : { _id: userId };
  const result = await UserModel.updateOne(filter, update);
  if (result.matchedCount === 0) throw new Error("No se pudo actualizar la membresía");
};