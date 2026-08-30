import { apiRequest } from '../lib/api';
import type { Checklist, ItemChecklist, Periodicidade } from '../types';

export interface CreateChecklistInput {
  titulo: string;
  periodicidade: Periodicidade;
  horarioDisponivelInicio?: string;
  horarioDisponivelFim?: string;
}

export interface UpdateChecklistInput {
  titulo?: string;
  periodicidade?: Periodicidade;
  ativo?: boolean;
  horarioDisponivelInicio?: string;
  horarioDisponivelFim?: string;
}

export interface CreateItemInput {
  descricao: string;
  ordem?: number;
  obrigatorio?: boolean;
}

export type UpdateItemInput = Partial<CreateItemInput>;

export function listarChecklists() {
  return apiRequest<Checklist[]>('/checklists');
}

export function buscarChecklist(id: number) {
  return apiRequest<Checklist>(`/checklists/${id}`);
}

export function criarChecklist(dto: CreateChecklistInput) {
  return apiRequest<Checklist>('/checklists', { method: 'POST', body: dto });
}

export function atualizarChecklist(id: number, dto: UpdateChecklistInput) {
  return apiRequest<Checklist>(`/checklists/${id}`, { method: 'PUT', body: dto });
}

export function removerChecklist(id: number) {
  return apiRequest<{ message: string }>(`/checklists/${id}`, { method: 'DELETE' });
}

export function criarItem(checklistId: number, dto: CreateItemInput) {
  return apiRequest<ItemChecklist>(`/checklists/${checklistId}/itens`, { method: 'POST', body: dto });
}

export function atualizarItem(checklistId: number, itemId: number, dto: UpdateItemInput) {
  return apiRequest<ItemChecklist>(`/checklists/${checklistId}/itens/${itemId}`, { method: 'PUT', body: dto });
}

export function removerItem(checklistId: number, itemId: number) {
  return apiRequest<{ message: string }>(`/checklists/${checklistId}/itens/${itemId}`, { method: 'DELETE' });
}
