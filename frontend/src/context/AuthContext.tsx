import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, setToken, setUnauthorizedHandler } from '../lib/api';
import { useNavigate } from '../lib/router';
import * as authService from '../services/auth';
import type { Usuario } from '../types';

const USER_KEY = 'checklist_user';

interface AuthContextValue {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string, nomeEmpresa: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): Usuario | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => (getToken() ? readStoredUser() : null));
  const navigate = useNavigate();

  function persistirSessao(token: string, novoUsuario: Usuario) {
    setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(novoUsuario));
    setUsuario(novoUsuario);
  }

  function sair() {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
    navigate('/login');
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      localStorage.removeItem(USER_KEY);
      setUsuario(null);
      navigate('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  async function entrar(email: string, senha: string) {
    const resposta = await authService.login(email, senha);
    persistirSessao(resposta.access_token, resposta.usuario);
  }

  async function cadastrar(nome: string, email: string, senha: string, nomeEmpresa: string) {
    await authService.registrar(nome, email, senha, nomeEmpresa);
    const resposta = await authService.login(email, senha);
    persistirSessao(resposta.access_token, resposta.usuario);
  }

  const value: AuthContextValue = { usuario, isAuthenticated: Boolean(usuario), entrar, cadastrar, sair };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
