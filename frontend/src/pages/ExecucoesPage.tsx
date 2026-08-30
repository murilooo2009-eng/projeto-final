import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconPlay } from '../components/Icon';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { formatDateTime, STATUS_EXECUCAO_LABEL } from '../lib/format';
import { useNavigate } from '../lib/router';
import { listarChecklists } from '../services/checklists';
import { iniciarExecucao, listarExecucoes } from '../services/execucoes';
import type { Checklist, ExecucaoResumo, StatusExecucao } from '../types';

function statusTone(status: StatusExecucao) {
  if (status === 'CONCLUIDA') return 'success' as const;
  if (status === 'CANCELADA') return 'danger' as const;
  return 'info' as const;
}

export function ExecucoesPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [execucoes, setExecucoes] = useState<ExecucaoResumo[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState<StatusExecucao | ''>('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [checklistsDisponiveis, setChecklistsDisponiveis] = useState<Checklist[]>([]);
  const [checklistEscolhido, setChecklistEscolhido] = useState<string>('');
  const [iniciando, setIniciando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await listarExecucoes({
        page: pagina,
        limit: 10,
        status: statusFiltro || undefined,
      });
      setExecucoes(resposta.dados);
      setTotalPaginas(resposta.paginacao.totalPaginas || 1);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.');
    } finally {
      setCarregando(false);
    }
  }, [pagina, statusFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function abrirModalExecutar() {
    setErroModal(null);
    setChecklistEscolhido('');
    setModalAberto(true);
    try {
      const dados = await listarChecklists();
      setChecklistsDisponiveis(dados.filter((checklist) => checklist.ativo));
    } catch (error) {
      setErroModal(error instanceof ApiError ? error.message : 'Não foi possível carregar os checklists.');
    }
  }

  async function onIniciar() {
    if (!checklistEscolhido) {
      setErroModal('Selecione um checklist para iniciar.');
      return;
    }
    setIniciando(true);
    setErroModal(null);
    try {
      const execucao = await iniciarExecucao(Number(checklistEscolhido));
      navigate(`/execucoes/${execucao.id}/executar`);
    } catch (error) {
      setErroModal(error instanceof ApiError ? error.message : 'Não foi possível iniciar o checklist.');
    } finally {
      setIniciando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Execuções</h1>
          <p className="page-subtitle">Acompanhe as execuções de checklists realizadas.</p>
        </div>
        <div className="page-header-actions">
          <Button icon={<IconPlay size={16} />} onClick={abrirModalExecutar}>
            Executar Checklist
          </Button>
        </div>
      </div>

      <div className="filters-bar">
        <Select
          label="Status"
          value={statusFiltro}
          onChange={(event) => {
            setPagina(1);
            setStatusFiltro(event.target.value as StatusExecucao | '');
          }}
        >
          <option value="">Todos</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDA">Concluído</option>
          <option value="CANCELADA">Cancelado</option>
        </Select>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando ? (
        <LoadingState label="Carregando execuções…" />
      ) : execucoes.length === 0 ? (
        <EmptyState
          title="Nenhuma execução encontrada"
          description="Assim que um checklist for executado, o registro aparecerá aqui."
          action={
            <Button icon={<IconPlay size={16} />} onClick={abrirModalExecutar}>
              Executar Checklist
            </Button>
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  {isAdmin && <th>Usuário</th>}
                  <th>Checklist</th>
                  <th>Progresso</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {execucoes.map((execucao) => (
                  <tr
                    key={execucao.id}
                    onClick={() => navigate(`/execucoes/${execucao.id}/executar`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td data-label="Data">{formatDateTime(execucao.iniciadaEm)}</td>
                    {isAdmin && <td data-label="Usuário">{execucao.usuario.nome}</td>}
                    <td data-label="Checklist" className="cell-primary">
                      {execucao.checklist.titulo}
                    </td>
                    <td data-label="Progresso" className="cell-muted">
                      {execucao.progresso.itensConcluidos}/{execucao.progresso.totalItens} ({execucao.progresso.percentual}%)
                    </td>
                    <td data-label="Status">
                      <Badge tone={statusTone(execucao.status)}>{STATUS_EXECUCAO_LABEL[execucao.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
        </>
      )}

      {modalAberto && (
        <Modal title="Executar Checklist" onClose={() => setModalAberto(false)}>
          <div className="form-grid">
            {erroModal && <div className="form-error">{erroModal}</div>}
            {checklistsDisponiveis.length === 0 && !erroModal ? (
              <LoadingState label="Carregando checklists…" />
            ) : (
              <Select
                label="Checklist"
                value={checklistEscolhido}
                onChange={(event) => setChecklistEscolhido(event.target.value)}
              >
                <option value="">Selecione...</option>
                {checklistsDisponiveis.map((checklist) => (
                  <option key={checklist.id} value={checklist.id}>
                    {checklist.titulo}
                  </option>
                ))}
              </Select>
            )}
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button type="button" loading={iniciando} onClick={onIniciar}>
                Iniciar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
