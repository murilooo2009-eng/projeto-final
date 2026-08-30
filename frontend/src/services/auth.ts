import { apiRequest } from '../lib/api';
import type { Usuario } from '../types';

export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
}

export interface RegisterResponse {
  empresa: { id: number; nome: string };
  usuario: Usuario;
}

export function login(email: string, senha: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, senha },
    auth: false,
  });
}

export function registrar(nome: string, email: string, senha: string, nomeEmpresa: string) {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: { nome, email, senha, nomeEmpresa },
    auth: false,
  });
}
