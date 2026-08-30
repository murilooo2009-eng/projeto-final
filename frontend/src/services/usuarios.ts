import { apiRequest } from '../lib/api';
import type { Perfil, Usuario } from '../types';

export interface CreateUsuarioInput {
  nome: string;
  email: string;
  senha?: string;
  perfil?: Perfil;
}

export type UpdateUsuarioInput = CreateUsuarioInput;

export function listarUsuarios() {
  return apiRequest<Usuario[]>('/usuarios');
}

export function buscarUsuario(id: number) {
  return apiRequest<Usuario>(`/usuarios/${id}`);
}

export function criarUsuario(dto: CreateUsuarioInput) {
  return apiRequest<Usuario>('/usuarios', { method: 'POST', body: dto });
}

export function atualizarUsuario(id: number, dto: UpdateUsuarioInput) {
  return apiRequest<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: dto });
}

export function alterarStatusUsuario(id: number, ativo: boolean) {
  return apiRequest<Usuario>(`/usuarios/${id}/status`, { method: 'PATCH', body: { ativo } });
}

export function removerUsuario(id: number) {
  return apiRequest<Usuario>(`/usuarios/${id}`, { method: 'DELETE' });
}
