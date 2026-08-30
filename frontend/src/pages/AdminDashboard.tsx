import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime, PERIODICIDADE_LABEL, STATUS_EXECUCAO_LABEL } from '../lib/format';
import type { DashboardAdmin, StatusExecucao } from '../types';

function statusTone(status: StatusExecucao) {
  if (status === 'CONCLUIDA') return 'success' as const;
  if (status === 'CANCELADA') return 'danger' as const;
  return 'info' as const;
}

export function AdminDashboard({ dashboard }: { dashboard: DashboardAdmin }) {
  const { metricas, execucoesRecentes, checklistsMaisExecutados } = dashboard;

  return (
    <div className="section-stack">
      <div className="metric-grid">
        <div className="metric-card tone-success">
          <div className="metric-card-value">{metricas.checklistsAtivos}</div>
          <div className="metric-card-label">Checklists Ativos</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="metric-card tone-danger">
          <div className="metric-card-value">{metricas.execucoes}</div>
          <div className="metric-card-label">Execuções Totais</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="metric-card tone-info">
          <div className="metric-card-value">{metricas.tarefasPendentes}</div>
          <div className="metric-card-label">Tarefas Pendentes</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="metric-card tone-warning">
          <div className="metric-card-value">{metricas.usuariosAtivos}</div>
          <div className="metric-card-label">Usuários</div>
          <div className="metric-card-bar">
            <div className="metric-card-bar-fill" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h2 className="card-title">Execuções recentes</h2>
          {execucoesRecentes.length === 0 ? (
            <EmptyState title="Nenhuma execução registrada ainda" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {execucoesRecentes.map((execucao) => (
                <div
                  key={execucao.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="checklist-run-title">{execucao.checklist.titulo}</div>
                    <div className="checklist-run-meta">
                      {execucao.usuario.nome} · {formatDateTime(execucao.iniciadaEm)}
                    </div>
                  </div>
                  <Badge tone={statusTone(execucao.status)}>{STATUS_EXECUCAO_LABEL[execucao.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Checklists mais executados</h2>
          {checklistsMaisExecutados.length === 0 ? (
            <EmptyState title="Sem execuções suficientes ainda" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {checklistsMaisExecutados.map((item) => (
                <div key={item.checklistId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div className="checklist-run-title">{item.titulo}</div>
                    <div className="checklist-run-meta">
                      {item.periodicidade ? PERIODICIDADE_LABEL[item.periodicidade] : '—'}
                    </div>
                  </div>
                  <Badge tone="neutral">{item.quantidadeExecucoes}x</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
