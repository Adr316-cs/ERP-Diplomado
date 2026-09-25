import { PermissionModel, RoleModel } from "./auth.model.js";

const resources = ["users", "companies", "branches", "customers", "suppliers", "categories", "products", "warehouses", "brands", "units", "taxes", "paymentMethods", "inventory", "sales", "purchases", "finance", "crm", "projects", "helpdesk", "hr", "reports", "audit", "notifications"] as const;
const standardActions = ["read", "create", "update", "delete"] as const;
const permissionKeys = resources.flatMap((resource) => standardActions.map((action) => `${resource}.${action}`)).concat([
  "inventory.adjust", "inventory.transfer", "sales.approve", "purchases.approve", "purchases.receive", "finance.pay", "notifications.mark_read", "profile.read", "hr.compensation.read"
]);

export const companyRoleNames = ["ADMIN", "MANAGER", "SALES", "PURCHASE", "WAREHOUSE", "FINANCE", "HR", "SUPPORT", "EMPLOYEE"] as const;

const allPermissions = [...new Set(permissionKeys)];
const readPermissions = allPermissions.filter((key) => key.endsWith(".read"));
const makeRolePermissions = (keys: string[]) => [...new Set(keys)];

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: allPermissions,
  ADMIN: allPermissions,
  MANAGER: makeRolePermissions([...readPermissions.filter((key) => key !== "hr.compensation.read"), "customers.create", "suppliers.create", "products.create", "categories.create", "warehouses.create", "inventory.create", "inventory.adjust", "inventory.transfer", "sales.create", "sales.update", "sales.approve", "purchases.create", "purchases.update", "purchases.approve", "purchases.receive", "finance.create", "finance.pay", "crm.create", "crm.update", "projects.create", "projects.update", "helpdesk.create", "helpdesk.update", "hr.read", "reports.read", "audit.read", "notifications.mark_read", "brands.create", "brands.update", "brands.delete", "units.create", "units.update", "units.delete", "taxes.create", "taxes.update", "taxes.delete", "paymentMethods.create", "paymentMethods.update", "paymentMethods.delete"]),
  SALES: ["brands.read", "units.read", "taxes.read", "customers.read", "customers.create", "products.read", "inventory.read", "sales.read", "sales.create", "sales.update", "crm.read", "crm.create", "crm.update", "reports.read", "notifications.read", "notifications.mark_read"],
  PURCHASE: ["brands.read", "units.read", "taxes.read", "suppliers.read", "suppliers.create", "products.read", "warehouses.read", "purchases.read", "purchases.create", "purchases.update", "purchases.receive", "inventory.read", "inventory.create", "finance.read", "notifications.read", "notifications.mark_read"],
  WAREHOUSE: ["units.read", "products.read", "warehouses.read", "inventory.read", "inventory.create", "inventory.adjust", "inventory.transfer", "sales.read", "sales.update", "purchases.read", "notifications.read", "notifications.mark_read"],
  FINANCE: ["finance.read", "finance.create", "finance.pay", "paymentMethods.read", "sales.read", "purchases.read", "reports.read", "audit.read", "notifications.read", "notifications.mark_read"],
  HR: ["hr.read", "hr.create", "hr.update", "hr.compensation.read", "users.read", "profile.read", "notifications.read", "notifications.mark_read"],
  SUPPORT: ["helpdesk.read", "helpdesk.create", "helpdesk.update", "projects.read", "profile.read", "notifications.read", "notifications.mark_read"],
  EMPLOYEE: ["profile.read", "companies.create", "companies.read", "notifications.read", "notifications.mark_read"],
  // Keep existing accounts assigned to the historical lowercase role at least-privilege access.
  user: ["profile.read", "companies.create", "companies.read", "notifications.read", "notifications.mark_read"]
};

const descriptions = new Map<string, string>(allPermissions.map((key) => [key, `Permite ${key.replaceAll(".", " ")}`]));

let seeding: Promise<void> | undefined;
const seedAuthorization = async () => {
  await PermissionModel.bulkWrite(allPermissions.map((key) => ({
    updateOne: { filter: { key }, update: { $setOnInsert: { key, description: descriptions.get(key)! } }, upsert: true }
  })));
  const permissions = await PermissionModel.find({ key: { $in: allPermissions } }).select("_id key").lean();
  const permissionIds = new Map(permissions.map((permission) => [permission.key, permission._id]));
  const idsFor = (keys: string[]) => keys.map((key) => {
    const id = permissionIds.get(key);
    if (!id) throw new Error(`Missing seeded permission: ${key}`);
    return id;
  });
  await RoleModel.bulkWrite(Object.entries(rolePermissions).map(([name, keys]) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, permissions: idsFor(keys) } },
      upsert: true
    }
  }))); 
  const masterPermissions = allPermissions.filter((key) => ["brands.", "units.", "taxes.", "paymentMethods."].some((prefix) => key.startsWith(prefix)));
  const extensions: Record<string, string[]> = { ADMIN: [...masterPermissions, "hr.compensation.read"], SUPER_ADMIN: ["hr.compensation.read"], HR: ["hr.compensation.read"], MANAGER: [...masterPermissions, "sales.update"], SALES: ["brands.read", "units.read", "taxes.read", "sales.update"], PURCHASE: ["brands.read", "units.read", "taxes.read"], WAREHOUSE: ["units.read", "sales.update"], FINANCE: ["paymentMethods.read"] };
  await Promise.all(Object.entries(extensions).map(([name, keys]) => RoleModel.updateOne(
    { name },
    { $addToSet: { permissions: { $each: idsFor(keys) } } }
  )));
  await RoleModel.updateOne({ name: "MANAGER" }, { $addToSet: { permissions: permissionIds.get("purchases.update") } });
  await RoleModel.updateOne({ name: "PURCHASE" }, { $pull: { permissions: permissionIds.get("purchases.approve") } });
  await RoleModel.updateOne({ name: "PURCHASE" }, { $addToSet: { permissions: permissionIds.get("purchases.update") } });
  const legacyEmployeeRole = await RoleModel.findOne({ name: "user" });
  if (legacyEmployeeRole && legacyEmployeeRole.permissions.length === 0) {
    const permissionIdsForEmployee = idsFor(rolePermissions["user"]!);
    await RoleModel.updateOne({ _id: legacyEmployeeRole._id, permissions: { $size: 0 } }, { $set: { permissions: permissionIdsForEmployee } });
  }
};

export const ensureAuthorizationSeeded = async () => {
  seeding ??= seedAuthorization();
  try {
    await seeding;
  } catch (error) {
    seeding = undefined;
    throw error;
  }
};

export const availableRoles = Object.keys(rolePermissions).filter((name) => name !== "user");
export const availablePermissions = allPermissions;
export const permissionsForRole = (name: string) => [...(rolePermissions[name] ?? [])];







