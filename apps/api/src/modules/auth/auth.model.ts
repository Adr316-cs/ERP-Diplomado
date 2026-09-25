import { Schema, model, type InferSchemaType } from "mongoose";

const permissionSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true }
}, { timestamps: true });

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }]
}, { timestamps: true });

const userRoleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
userRoleSchema.index({ userId: 1, companyId: 1, roleId: 1 }, { unique: true });

const userCompanySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
  isOwner: { type: Boolean, required: true, default: false },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
userCompanySchema.index({ userId: 1, companyId: 1 }, { unique: true });

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
  roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
  memberships: [{
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    isOwner: { type: Boolean, required: true, default: false }
  }],
  tokenVersion: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, required: true, default: true }
}, { timestamps: true });

export type PermissionDocument = InferSchemaType<typeof permissionSchema>;
export type RoleDocument = InferSchemaType<typeof roleSchema>;
export type UserRoleDocument = InferSchemaType<typeof userRoleSchema>;
export type UserCompanyDocument = InferSchemaType<typeof userCompanySchema>;
export type UserDocument = InferSchemaType<typeof userSchema>;

export const PermissionModel = model("Permission", permissionSchema);
export const RoleModel = model("Role", roleSchema);
export const UserRoleModel = model("UserRole", userRoleSchema);
export const UserCompanyModel = model("UserCompany", userCompanySchema);
export const UserModel = model("User", userSchema);
