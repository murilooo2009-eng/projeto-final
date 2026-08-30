import { useCallback, useEffect, useState } from 'react';
import { LoadingState } from '../components/LoadingState';
import { ErrorBanner } from '../components/ErrorBanner';
import { obterDashboard } from '../services/dashboard';
import { ApiError } from '../lib/api';
import type { Dashboard } from '../types';
import { AdminDashboard } from './AdminDashboard';
import { ColaboradorDashboard } from './ColaboradorDashboard';

export function DashboardPage() {
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await obterDashboard();
      setDados(resposta);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o dashboard.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral das rotinas e checklists da empresa.</p>
        </div>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando && !dados && <LoadingState label="Carregando dashboard…" />}

      {dados?.perfil === 'ADMIN' && <AdminDashboard dashboard={dados} />}
      {dados?.perfil === 'COLABORADOR' && <ColaboradorDashboard dashboard={dados} onRefresh={carregar} />}
    </div>
  );
}
