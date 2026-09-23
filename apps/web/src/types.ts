export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type CompanyMembership = {
  companyId: string;
  branchIds: string[];
  isOwner: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  memberships: CompanyMembership[];
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};
