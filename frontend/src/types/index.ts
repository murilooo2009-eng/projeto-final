export type Perfil = 'ADMIN' | 'COLABORADOR';
export type Periodicidade = 'DIARIO' | 'SEMANAL';
export type StatusExecucao = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  empresaId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemChecklist {
  id: number;
  descricao: string;
  ordem: number;
  obrigatorio: boolean;
  checklistId?: number;
}

export interface Checklist {
  id: number;
  titulo: string;
  periodicidade: Periodicidade;
  ativo: boolean;
  horarioDisponivelInicio?: string | null;
  horarioDisponivelFim?: string | null;
  empresaId?: number;
  itens: ItemChecklist[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExecucaoItem {
  id: number;
  itemChecklistId: number;
  descricao: string;
  ordem: number;
  obrigatorio: boolean;
  concluido: boolean;
  concluidoEm?: string | null;
}

export interface ExecucaoProgresso {
  totalItens: number;
  itensConcluidos: number;
  percentual: number;
  podeFinalizar?: boolean;
  obrigatoriosPendentes?: number;
}

export interface ChecklistResumo {
  id: number;
  titulo: string;
  periodicidade: Periodicidade;
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Execucao {
  id: number;
  status: StatusExecucao;
  iniciadaEm: string;
  finalizadaEm?: string | null;
  checklist?: ChecklistResumo;
  usuario?: UsuarioResumo;
  itens: ExecucaoItem[];
  progresso: ExecucaoProgresso;
}

export interface ExecucaoResumo {
  id: number;
  checklist: ChecklistResumo;
  usuario: UsuarioResumo;
  status: StatusExecucao;
  iniciadaEm: string;
  finalizadaEm?: string | null;
  progresso: { totalItens: number; itensConcluidos: number; percentual: number };
}

export interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface ListaExecucoes {
  dados: ExecucaoResumo[];
  paginacao: Paginacao;
}

export interface ExecucoesFiltro {
  page?: number;
  limit?: number;
  status?: StatusExecucao;
  checklistId?: number;
  usuarioId?: number;
}

export interface DashboardMetricasAdmin {
  usuariosAtivos: number;
  checklistsAtivos: number;
  execucoes: number;
  execucoesConcluidas: number;
  execucoesEmAndamento: number;
  execucoesCanceladas: number;
  tarefasPendentes: number;
  mediaConclusao: number;
}

export interface DashboardAdmin {
  perfil: 'ADMIN';
  metricas: DashboardMetricasAdmin;
  execucoesPorStatus: { status: StatusExecucao; quantidade: number }[];
  execucoesUltimosDias: { data: string; quantidade: number; concluidas: number }[];
  checklistsMaisExecutados: { checklistId: number; titulo: string; periodicidade: Periodicidade | null; quantidadeExecucoes: number }[];
  execucoesRecentes: ExecucaoResumo[];
  usuariosAtivos: { id: number; nome: string; perfil: Perfil }[];
  checklistsAtivos: { id: number; titulo: string; periodicidade: Periodicidade }[];
}

export interface DashboardMetricasColaborador {
  checklistsDisponiveis: number;
  tarefasPendentes: number;
  execucoesConcluidas: number;
  execucoesEmAndamento: number;
  totalExecucoes: number;
  mediaConclusao: number;
}

export interface ChecklistComProgresso {
  id: number;
  titulo: string;
  periodicidade: Periodicidade;
  horarioDisponivelInicio?: string | null;
  horarioDisponivelFim?: string | null;
  totalItens: number;
  itensConcluidos: number;
  percentual: number;
  emAndamento: boolean;
  execucaoId: number | null;
}

export interface DashboardColaborador {
  perfil: 'COLABORADOR';
  metricas: DashboardMetricasColaborador;
  checklists: ChecklistComProgresso[];
  execucoesEmAndamento: Execucao[];
  execucoesRecentes: Execucao[];
}

export type Dashboard = DashboardAdmin | DashboardColaborador;
