import { Schema, model, type InferSchemaType } from "mongoose";

const permissionSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true }
}, { timestamps: true });

const roleSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }]
}, { timestamps: true });

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
export type UserDocument = InferSchemaType<typeof userSchema>;

export const PermissionModel = model("Permission", permissionSchema);
export const RoleModel = model("Role", roleSchema);
export const UserModel = model("User", userSchema);