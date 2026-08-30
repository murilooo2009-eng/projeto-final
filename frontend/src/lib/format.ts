export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const PERIODICIDADE_LABEL: Record<string, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
};

export const STATUS_EXECUCAO_LABEL: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluído',
  CANCELADA: 'Cancelado',
};

export const PERFIL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  COLABORADOR: 'Colaborador',
};
