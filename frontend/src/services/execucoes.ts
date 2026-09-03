import { apiRequest } from '../lib/api';
import type { Execucao, ExecucoesFiltro, ListaExecucoes } from '../types';

export function iniciarExecucao(checklistId: number) {
  return apiRequest<Execucao>(`/execucoes/checklists/${checklistId}`, { method: 'POST' });
}

export function listarExecucoes(filtro: ExecucoesFiltro) {
  return apiRequest<ListaExecucoes>('/execucoes', {
    query: {
      page: filtro.page,
      limit: filtro.limit,
      status: filtro.status,
      checklistId: filtro.checklistId,
      usuarioId: filtro.usuarioId,
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
    },
  });
}

export function buscarExecucao(id: number) {
  return apiRequest<Execucao>(`/execucoes/${id}`);
}

export function atualizarItemExecucao(execucaoId: number, itemId: number, concluido: boolean) {
  return apiRequest<unknown>(`/execucoes/${execucaoId}/itens/${itemId}`, {
    method: 'PATCH',
    body: { concluido },
  });
}

export function finalizarExecucao(id: number) {
  return apiRequest<Execucao>(`/execucoes/${id}/finalizar`, { method: 'POST' });
}

export function cancelarExecucao(id: number) {
  return apiRequest<unknown>(`/execucoes/${id}/cancelar`, { method: 'POST' });
}
