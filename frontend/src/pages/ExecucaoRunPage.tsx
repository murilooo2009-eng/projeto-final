import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { formatDateTime, STATUS_EXECUCAO_LABEL } from '../lib/format';
import { Link, useNavigate, useParams } from '../lib/router';
import { atualizarItemExecucao, buscarExecucao, cancelarExecucao, finalizarExecucao } from '../services/execucoes';
import type { Execucao, StatusExecucao } from '../types';

function statusTone(status: StatusExecucao) {
  if (status === 'CONCLUIDA') return 'success' as const;
  if (status === 'CANCELADA') return 'danger' as const;
  return 'info' as const;
}

export function ExecucaoRunPage() {
  const { id } = useParams();
  const execucaoId = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizandoItem, setAtualizandoItem] = useState<number | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarExecucao(execucaoId);
      setExecucao(dados);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar a execução.');
    } finally {
      setCarregando(false);
    }
  }, [execucaoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onToggleItem(itemId: number, concluido: boolean) {
    if (!execucao || execucao.status !== 'EM_ANDAMENTO') return;
    setAtualizandoItem(itemId);
    try {
      await atualizarItemExecucao(execucao.id, itemId, concluido);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível atualizar o item.');
    } finally {
      setAtualizandoItem(null);
    }
  }

  async function onFinalizar() {
    if (!execucao) return;
    setFinalizando(true);
    setErro(null);
    try {
      await finalizarExecucao(execucao.id);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível finalizar a execução.');
    } finally {
      setFinalizando(false);
    }
  }

  async function onCancelar() {
    if (!execucao) return;
    if (!window.confirm('Cancelar esta execução? O progresso será mantido no histórico como cancelado.')) return;
    setCancelando(true);
    setErro(null);
    try {
      await cancelarExecucao(execucao.id);
      navigate('/execucoes');
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível cancelar a execução.');
    } finally {
      setCancelando(false);
    }
  }

  const podeEditar =
    execucao?.status === 'EM_ANDAMENTO' && (usuario?.perfil === 'ADMIN' || usuario?.id === execucao?.usuario?.id);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/execucoes">Execuções</Link>
        <span>/</span>
        <span>Executar</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            Executar Checklist{execucao?.checklist ? `: ${execucao.checklist.titulo}` : ''}
          </h1>
          {execucao && (
            <p className="page-subtitle">
              Iniciado em {formatDateTime(execucao.iniciadaEm)}
              {execucao.usuario ? ` por ${execucao.usuario.nome}` : ''}
            </p>
          )}
        </div>
        {execucao && <Badge tone={statusTone(execucao.status)}>{STATUS_EXECUCAO_LABEL[execucao.status]}</Badge>}
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando && !execucao ? (
        <LoadingState label="Carregando execução…" />
      ) : execucao ? (
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="progress-bar" style={{ marginBottom: 18 }}>
            <div className="progress-bar-fill" style={{ width: `${execucao.progresso.percentual}%` }} />
          </div>

          <div>
            {execucao.itens.map((item) => (
              <label key={item.id} className={`check-row ${item.concluido ? 'check-row-done' : ''}`}>
                <input
                  type="checkbox"
                  checked={item.concluido}
                  disabled={!podeEditar || atualizandoItem === item.id}
                  onChange={(event) => onToggleItem(item.id, event.target.checked)}
                />
                <span className="check-row-label">{item.descricao}</span>
                {item.obrigatorio && <span className="required-tag">(Obrigatório)</span>}
              </label>
            ))}
          </div>

          {podeEditar && (
            <div className="form-actions" style={{ marginTop: 20 }}>
              <Button variant="secondary" onClick={onCancelar} loading={cancelando}>
                Cancelar Execução
              </Button>
              <Button
                onClick={onFinalizar}
                loading={finalizando}
                disabled={!execucao.progresso.podeFinalizar}
                title={
                  execucao.progresso.podeFinalizar
                    ? undefined
                    : `Existem ${execucao.progresso.obrigatoriosPendentes ?? 0} item(ns) obrigatório(s) pendente(s)`
                }
              >
                Finalizar Execução
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
