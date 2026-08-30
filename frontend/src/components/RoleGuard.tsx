import type { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Perfil } from '../types';
import { EmptyState } from './EmptyState';

export function RoleGuard({ allow, children }: { allow: Perfil[]; children: ReactElement }) {
  const { usuario } = useAuth();

  if (!usuario || !allow.includes(usuario.perfil)) {
    return (
      <EmptyState
        title="Acesso restrito"
        description="Você não possui permissão para acessar esta área."
      />
    );
  }

  return children;
}
