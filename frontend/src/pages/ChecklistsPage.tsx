import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconChecklist, IconList, IconPencil, IconPlus, IconTrash } from '../components/Icon';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { PERIODICIDADE_LABEL } from '../lib/format';
import { useNavigate } from '../lib/router';
import { listarChecklists, removerChecklist } from '../services/checklists';
import type { Checklist } from '../types';

export function ChecklistsPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarChecklists();
      setChecklists(dados);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os checklists.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onRemover(checklist: Checklist) {
    if (!window.confirm(`Remover o checklist "${checklist.titulo}"? Esta ação não pode ser desfeita.`)) return;
    setRemovendoId(checklist.id);
    try {
      await removerChecklist(checklist.id);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível remover o checklist.');
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Checklists</h1>
          <p className="page-subtitle">Gerencie os checklists operacionais da empresa.</p>
        </div>
        {isAdmin && (
          <div className="page-header-actions">
            <Button icon={<IconPlus size={16} />} onClick={() => navigate('/checklists/novo')}>
              Novo Checklist
            </Button>
          </div>
        )}
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando ? (
        <LoadingState label="Carregando checklists…" />
      ) : checklists.length === 0 ? (
        <EmptyState
          title="Nenhum checklist cadastrado"
          description={
            isAdmin ? 'Crie o primeiro checklist para organizar as rotinas da empresa.' : 'Aguarde a administração cadastrar checklists.'
          }
          action={
            isAdmin ? (
              <Button icon={<IconPlus size={16} />} onClick={() => navigate('/checklists/novo')}>
                Novo Checklist
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Periodicidade</th>
                <th>Itens</th>
                <th>Status</th>
                {isAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {checklists.map((checklist) => (
                <tr key={checklist.id}>
                  <td data-label="Título" className="cell-primary">
                    {checklist.titulo}
                  </td>
                  <td data-label="Periodicidade">{PERIODICIDADE_LABEL[checklist.periodicidade]}</td>
                  <td data-label="Itens" className="cell-muted">
                    {checklist.itens.length}
                  </td>
                  <td data-label="Status">
                    <Badge tone={checklist.ativo ? 'success' : 'neutral'}>{checklist.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  {isAdmin && (
                    <td data-label="Ações">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          title="Ver itens"
                          onClick={() => navigate(`/checklists/${checklist.id}/itens`)}
                        >
                          <IconList size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-edit"
                          title="Editar"
                          onClick={() => navigate(`/checklists/${checklist.id}/editar`)}
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          title="Excluir"
                          disabled={removendoId === checklist.id}
                          onClick={() => onRemover(checklist)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isAdmin && checklists.length > 0 && (
        <p className="page-subtitle" style={{ marginTop: 14 }}>
          <IconChecklist size={14} /> Para executar um checklist, acesse a página de Execuções.
        </p>
      )}
    </div>
  );
}
