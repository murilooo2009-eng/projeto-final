import { useState } from 'react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ApiError } from '../lib/api';
import { PERIODICIDADE_LABEL } from '../lib/format';
import { useNavigate } from '../lib/router';
import { iniciarExecucao } from '../services/execucoes';
import type { DashboardColaborador } from '../types';

export function ColaboradorDashboard({
  dashboard,
  onRefresh,
}: {
  dashboard: DashboardColaborador;
  onRefresh: () => void;
}) {
  const { metricas, checklists } = dashboard;
  const navigate = useNavigate();
  const [iniciando, setIniciando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function onIniciar(checklistId: number, execucaoIdExistente: number | null) {
    if (execucaoIdExistente) {
      navigate(`/execucoes/${execucaoIdExistente}/executar`);
      return;
    }
    setErro(null);
    setIniciando(checklistId);
    try {
      const execucao = await iniciarExecucao(checklistId);
      navigate(`/execucoes/${execucao.id}/executar`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível iniciar o checklist.');
      onRefresh();
    } finally {
      setIniciando(null);
    }
  }

  return (
    <div className="section-stack">
      <div className="metric-grid">
        <div className="metric-card tone-success">
          <div className="metric-card-value">{metricas.checklistsDisponiveis}</div>
          <div className="metric-card-label">Checklists Disponíveis</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="metric-card tone-info">
          <div className="metric-card-value">{metricas.execucoesEmAndamento}</div>
          <div className="metric-card-label">Em Andamento</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="metric-card tone-danger">
          <div className="metric-card-value">{metricas.tarefasPendentes}</div>
          <div className="metric-card-label">Pendentes</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="metric-card tone-warning">
          <div className="metric-card-value">{metricas.execucoesConcluidas}</div>
          <div className="metric-card-label">Concluídas</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {erro && <div className="form-error">{erro}</div>}

      <div className="card">
        <h2 className="card-title">Suas rotinas</h2>
        {checklists.length === 0 ? (
          <EmptyState
            title="Nenhum checklist disponível"
            description="Assim que a administração cadastrar checklists, eles aparecerão aqui."
          />
        ) : (
          <div>
            {checklists.map((checklist) => (
              <div key={checklist.id} className="checklist-run-card">
                <div className="checklist-run-info">
                  <div className="checklist-run-title">{checklist.titulo}</div>
                  <div className="checklist-run-meta">
                    {PERIODICIDADE_LABEL[checklist.periodicidade]}
                    {checklist.horarioDisponivelInicio && checklist.horarioDisponivelFim
                      ? ` · Disponível ${checklist.horarioDisponivelInicio} – ${checklist.horarioDisponivelFim}`
                      : ''}
                  </div>
                  <div className="checklist-run-progress">
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${checklist.percentual}%` }} />
                    </div>
                  </div>
                </div>
                <Button
                  variant={checklist.emAndamento ? 'secondary' : 'primary'}
                  loading={iniciando === checklist.id}
                  onClick={() => onIniciar(checklist.id, checklist.execucaoId)}
                >
                  {checklist.emAndamento ? 'Continuar' : 'Iniciar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
