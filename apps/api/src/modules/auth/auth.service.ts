import { loadEnvironment, type Environment } from "../../config/environment.js";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { HttpError } from "../../middleware/errors.js";
import { hashPassword, verifyPassword } from "./auth.crypto.js";
import { createUser, findUserByEmail, findUserById, incrementTokenVersion } from "./auth.repository.js";
import { signToken, verifyToken } from "./auth.tokens.js";
import type { AuthTokens, AuthUser, CompanyMembership } from "./auth.types.js";

type PopulatedUser = {
  _id: { toString: () => string };
  email: string;
  name: string;
  tokenVersion: number;
  isActive: boolean;
  roles: Array<{ name: string; permissions: Array<{ key: string }> }>;
  memberships: Array<{ companyId: { toString: () => string }; branchIds: Array<{ toString: () => string }>; isOwner: boolean }>;
};

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") {
    throw new HttpError(503, "DATABASE_UNAVAILABLE", "El servicio de identidad no está disponible");
  }
};

const userView = (user: PopulatedUser): AuthUser => {
  const roles = user.roles.map((role) => role.name);
  const permissions = user.roles.flatMap((role) => role.permissions.map((permission) => permission.key));
  const memberships: CompanyMembership[] = user.memberships.map((membership) => ({
    companyId: membership.companyId.toString(),
    branchIds: membership.branchIds.map((branchId) => branchId.toString()),
    isOwner: membership.isOwner
  }));
  return { id: user._id.toString(), email: user.email, name: user.name, roles, permissions, memberships };
};

const issueTokens = async (user: PopulatedUser, environment: Environment): Promise<AuthTokens> => {
  const view = userView(user);
  return {
    accessToken: await signToken(view, user.tokenVersion, "access", environment),
    refreshToken: await signToken(view, user.tokenVersion, "refresh", environment),
    expiresIn: environment.JWT_ACCESS_EXPIRES_IN
  };
};

export const register = async (input: { email: string; name: string; password: string }, environment = loadEnvironment()) => {
  databaseRequired();
  const email = input.email.toLowerCase();
  if (await findUserByEmail(email)) {
    throw new HttpError(409, "EMAIL_IN_USE", "El correo ya está registrado");
  }

  const user = await createUser({ email, name: input.name, passwordHash: await hashPassword(input.password) });
  const storedUser = await findUserById(user._id.toString()) as unknown as PopulatedUser | null;
  if (!storedUser) throw new HttpError(500, "USER_CREATION_FAILED", "No fue posible crear el usuario");
  return { user: userView(storedUser), tokens: await issueTokens(storedUser, environment) };
};

export const login = async (input: { email: string; password: string }, environment = loadEnvironment()) => {
  databaseRequired();
  const user = await findUserByEmail(input.email.toLowerCase()) as unknown as (PopulatedUser & { passwordHash: string }) | null;
  if (!user || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Credenciales inválidas");
  }

  return { user: userView(user), tokens: await issueTokens(user, environment) };
};

export const refresh = async (refreshToken: string, environment = loadEnvironment()) => {
  databaseRequired();
  let payload;
  try {
    payload = await verifyToken(refreshToken, "refresh", environment);
  } catch {
    throw new HttpError(401, "INVALID_REFRESH_TOKEN", "Refresh token inválido o expirado");
  }

  const user = await findUserById(payload.sub) as unknown as PopulatedUser | null;
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw new HttpError(401, "INVALID_REFRESH_TOKEN", "Refresh token inválido o revocado");
  }

  return { user: userView(user), tokens: await issueTokens(user, environment) };
};

export const logout = async (userId: string) => {
  databaseRequired();
  await incrementTokenVersion(userId);
};

export const getCurrentUser = async (userId: string, expectedTokenVersion?: number) => {
  databaseRequired();
  const user = await findUserById(userId) as unknown as PopulatedUser | null;
  if (!user || !user.isActive || (expectedTokenVersion !== undefined && user.tokenVersion !== expectedTokenVersion)) {
    throw new HttpError(401, "USER_INACTIVE", "Usuario no disponible");
  }
  return userView(user);
};