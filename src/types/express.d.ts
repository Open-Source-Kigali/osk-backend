import type { UserRole } from "../generated/prisma/client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      authSession?: AuthSession;
    }
  }
}

export {};
