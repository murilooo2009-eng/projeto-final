import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  empresaId: number;
  role: Role;
}