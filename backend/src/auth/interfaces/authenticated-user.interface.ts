import { Perfil } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  empresaId: number;
  perfil: Perfil;
}