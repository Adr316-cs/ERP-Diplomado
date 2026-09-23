import bcrypt from "bcryptjs";

const HASH_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, HASH_ROUNDS);

export const verifyPassword = (password: string, passwordHash: string): Promise<boolean> =>
  bcrypt.compare(password, passwordHash);