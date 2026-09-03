import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconPencil, IconPlus, IconTrash } from '../components/Icon';
import { LoadingState } from '../components/LoadingState';
import { Toggle } from '../components/Toggle';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Link, useNavigate, useParams } from '../lib/router';
import { atualizarItem, buscarChecklist, removerItem } from '../services/checklists';
import type { Checklist, ItemChecklist } from '../types';

export function ChecklistItemsPage() {
  const { id } = useParams();
  const checklistId = Number(id);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarChecklist(checklistId);
      setChecklist(dados);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o checklist.');
    } finally {
      setCarregando(false);
    }
  }, [checklistId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onRemover(item: ItemChecklist) {
    if (!window.confirm(`Remover o item "${item.descricao}"?`)) return;
    setRemovendoId(item.id);
    try {
      await removerItem(checklistId, item.id);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível remover o item.');
    } finally {
      setRemovendoId(null);
    }
  }

  async function onToggleObrigatorio(item: ItemChecklist, obrigatorio: boolean) {
    try {
      await atualizarItem(checklistId, item.id, { obrigatorio });
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível atualizar o item.');
    }
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/checklists">Checklists</Link>
        <span>/</span>
        <span>Itens</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Itens do Checklist{checklist ? `: ${checklist.titulo}` : ''}</h1>
        </div>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando ? (
        <LoadingState label="Carregando itens…" />
      ) : !checklist || checklist.itens.length === 0 ? (
        <EmptyState
          title="Nenhum item cadastrado"
          description="Adicione itens para que os colaboradores possam executá-los."
          action={
            isAdmin ? (
              <Button icon={<IconPlus size={16} />} onClick={() => navigate(`/checklists/${checklistId}/itens/novo`)}>
                Novo Item
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Descrição</th>
                <th>Obrigatório</th>
                {isAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {checklist.itens.map((item) => (
                <tr key={item.id}>
                  <td data-label="Ordem" className="cell-muted">
                    {item.ordem}
                  </td>
                  <td data-label="Descrição" className="cell-primary">
                    {item.descricao}
                  </td>
                  <td data-label="Obrigatório">
                    <Toggle
                      checked={item.obrigatorio}
                      onChange={(checked) => onToggleObrigatorio(item, checked)}
                      disabled={!isAdmin}
                    />
                  </td>
                  {isAdmin && (
                    <td data-label="Ações">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-edit"
                          title="Editar"
                          onClick={() => navigate(`/checklists/${checklistId}/itens/${item.id}/editar`)}
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          title="Excluir"
                          disabled={removendoId === item.id}
                          onClick={() => onRemover(item)}
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

      {isAdmin && checklist && checklist.itens.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Button icon={<IconPlus size={16} />} onClick={() => navigate(`/checklists/${checklistId}/itens/novo`)}>
            Novo Item
          </Button>
        </div>
      )}
    </div>
  );
}
