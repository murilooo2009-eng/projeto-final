import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconPencil, IconPlus, IconTrash } from '../components/Icon';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { Toggle } from '../components/Toggle';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Link, useParams } from '../lib/router';
import {
  atualizarItem,
  buscarChecklist,
  criarItem,
  removerItem,
  type CreateItemInput,
} from '../services/checklists';
import type { Checklist, ItemChecklist } from '../types';

interface FormState {
  descricao: string;
  ordem: string;
  obrigatorio: boolean;
}

const FORM_INICIAL: FormState = { descricao: '', ordem: '', obrigatorio: false };

export function ChecklistItemsPage() {
  const { id } = useParams();
  const checklistId = Number(id);
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ItemChecklist | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
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

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErroForm(null);
    setModalAberto(true);
  }

  function abrirEdicao(item: ItemChecklist) {
    setEditando(item);
    setForm({ descricao: item.descricao, ordem: String(item.ordem), obrigatorio: item.obrigatorio });
    setErroForm(null);
    setModalAberto(true);
  }

  async function onSalvar() {
    if (!form.descricao.trim()) {
      setErroForm('Informe a descrição do item.');
      return;
    }

    const dto: CreateItemInput = {
      descricao: form.descricao,
      obrigatorio: form.obrigatorio,
      ordem: form.ordem ? Number(form.ordem) : undefined,
    };

    setSalvando(true);
    setErroForm(null);

    try {
      if (editando) {
        await atualizarItem(checklistId, editando.id, dto);
      } else {
        await criarItem(checklistId, dto);
      }
      setModalAberto(false);
      await carregar();
    } catch (error) {
      setErroForm(error instanceof ApiError ? error.message : 'Não foi possível salvar o item.');
    } finally {
      setSalvando(false);
    }
  }

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
          <p className="page-subtitle">Organize as tarefas que compõem esta rotina.</p>
        </div>
        {isAdmin && (
          <div className="page-header-actions">
            <Button icon={<IconPlus size={16} />} onClick={abrirNovo}>
              Novo Item
            </Button>
          </div>
        )}
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
              <Button icon={<IconPlus size={16} />} onClick={abrirNovo}>
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
                        <button type="button" className="icon-btn" title="Editar" onClick={() => abrirEdicao(item)}>
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

      {modalAberto && (
        <Modal title={editando ? 'Editar Item' : 'Novo Item'} onClose={() => setModalAberto(false)}>
          <div className="form-grid">
            {erroForm && <div className="form-error">{erroForm}</div>}
            <Input
              label="Descrição"
              name="descricao"
              value={form.descricao}
              onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
              required
            />
            <Input
              label="Ordem"
              name="ordem"
              type="number"
              min={1}
              hint="Deixe em branco para adicionar ao final"
              value={form.ordem}
              onChange={(event) => setForm((prev) => ({ ...prev, ordem: event.target.value }))}
            />
            <Toggle
              label="Obrigatório"
              checked={form.obrigatorio}
              onChange={(checked) => setForm((prev) => ({ ...prev, obrigatorio: checked }))}
            />
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button type="button" loading={salvando} onClick={onSalvar}>
                Salvar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
