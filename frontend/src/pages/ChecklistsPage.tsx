import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconChecklist, IconList, IconPencil, IconPlus, IconTrash } from '../components/Icon';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { PERIODICIDADE_LABEL } from '../lib/format';
import { useNavigate } from '../lib/router';
import {
  atualizarChecklist,
  criarChecklist,
  listarChecklists,
  removerChecklist,
  type CreateChecklistInput,
} from '../services/checklists';
import type { Checklist, Periodicidade } from '../types';

interface FormState {
  titulo: string;
  periodicidade: Periodicidade;
  ativo: boolean;
}

const FORM_INICIAL: FormState = { titulo: '', periodicidade: 'DIARIO', ativo: true };

export function ChecklistsPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Checklist | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

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

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErroForm(null);
    setModalAberto(true);
  }

  function abrirEdicao(checklist: Checklist) {
    setEditando(checklist);
    setForm({ titulo: checklist.titulo, periodicidade: checklist.periodicidade, ativo: checklist.ativo });
    setErroForm(null);
    setModalAberto(true);
  }

  async function onSalvar() {
    if (!form.titulo.trim()) {
      setErroForm('Informe o título do checklist.');
      return;
    }

    setSalvando(true);
    setErroForm(null);

    try {
      if (editando) {
        await atualizarChecklist(editando.id, form);
      } else {
        const dto: CreateChecklistInput = { titulo: form.titulo, periodicidade: form.periodicidade };
        await criarChecklist(dto);
      }
      setModalAberto(false);
      await carregar();
    } catch (error) {
      setErroForm(error instanceof ApiError ? error.message : 'Não foi possível salvar o checklist.');
    } finally {
      setSalvando(false);
    }
  }

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
            <Button icon={<IconPlus size={16} />} onClick={abrirNovo}>
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
          description={isAdmin ? 'Crie o primeiro checklist para organizar as rotinas da empresa.' : 'Aguarde a administração cadastrar checklists.'}
          action={
            isAdmin ? (
              <Button icon={<IconPlus size={16} />} onClick={abrirNovo}>
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
                        <button type="button" className="icon-btn" title="Editar" onClick={() => abrirEdicao(checklist)}>
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

      {modalAberto && (
        <Modal title={editando ? 'Editar Checklist' : 'Novo Checklist'} onClose={() => setModalAberto(false)}>
          <div className="form-grid">
            {erroForm && <div className="form-error">{erroForm}</div>}
            <Input
              label="Título"
              name="titulo"
              value={form.titulo}
              onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
              required
            />
            <Select
              label="Periodicidade"
              name="periodicidade"
              value={form.periodicidade}
              onChange={(event) => setForm((prev) => ({ ...prev, periodicidade: event.target.value as Periodicidade }))}
            >
              <option value="DIARIO">Diário</option>
              <option value="SEMANAL">Semanal</option>
            </Select>
            {editando && (
              <Toggle
                label="Ativo"
                checked={form.ativo}
                onChange={(checked) => setForm((prev) => ({ ...prev, ativo: checked }))}
              />
            )}
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
