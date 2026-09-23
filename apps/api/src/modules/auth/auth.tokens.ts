import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Environment } from "../../config/environment.js";
import type { AuthUser } from "./auth.types.js";

type TokenKind = "access" | "refresh";

type TokenPayload = JWTPayload & {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  tokenVersion: number;
  memberships: AuthUser["memberships"];
  type: TokenKind;
};

const secretFor = (environment: Environment, type: TokenKind): Uint8Array =>
  new TextEncoder().encode(type === "access" ? environment.JWT_ACCESS_SECRET : environment.JWT_REFRESH_SECRET);

const durationFor = (environment: Environment, type: TokenKind): string =>
  type === "access" ? environment.JWT_ACCESS_EXPIRES_IN : environment.JWT_REFRESH_EXPIRES_IN;

export const signToken = async (user: AuthUser, tokenVersion: number, type: TokenKind, environment: Environment): Promise<string> =>
  new SignJWT({ email: user.email, roles: user.roles, permissions: user.permissions, memberships: user.memberships, tokenVersion, type })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("erp-api")
    .setExpirationTime(durationFor(environment, type))
    .sign(secretFor(environment, type));

export const verifyToken = async (token: string, type: TokenKind, environment: Environment): Promise<TokenPayload> => {
  const { payload } = await jwtVerify(token, secretFor(environment, type), { issuer: "erp-api" });

  if (payload.type !== type || typeof payload.sub !== "string" || typeof payload.email !== "string" ||
      !Array.isArray(payload.roles) || !Array.isArray(payload.permissions) || !Array.isArray(payload.memberships) || typeof payload.tokenVersion !== "number") {
    throw new Error("Token claims invalidos");
  }

  return payload as TokenPayload;
};