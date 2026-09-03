import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconPencil, IconPlus, IconTrash } from '../components/Icon';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { PERFIL_LABEL } from '../lib/format';
import { useNavigate } from '../lib/router';
import { alterarStatusUsuario, listarUsuarios } from '../services/usuarios';
import type { Usuario } from '../types';

export function UsuariosPage() {
  const navigate = useNavigate();
  const { usuario: usuarioLogado } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await listarUsuarios();
      setUsuarios(dados);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os usuários.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onAlterarStatus(item: Usuario) {
    const acao = item.ativo ? 'desativar' : 'reativar';
    if (!window.confirm(`Deseja ${acao} o usuário "${item.nome}"?`)) return;
    setAtualizandoId(item.id);
    try {
      await alterarStatusUsuario(item.id, !item.ativo);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível atualizar o usuário.');
    } finally {
      setAtualizandoId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Gerencie os colaboradores com acesso ao sistema.</p>
        </div>
        <div className="page-header-actions">
          <Button icon={<IconPlus size={16} />} onClick={() => navigate('/usuarios/novo')}>
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando ? (
        <LoadingState label="Carregando usuários…" />
      ) : usuarios.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado"
          description="Adicione colaboradores para que possam acessar o sistema."
          action={
            <Button icon={<IconPlus size={16} />} onClick={() => navigate('/usuarios/novo')}>
              Adicionar Usuário
            </Button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((item) => (
                <tr key={item.id}>
                  <td data-label="Nome" className="cell-primary">
                    {item.nome}
                  </td>
                  <td data-label="E-mail" className="cell-muted">
                    {item.email}
                  </td>
                  <td data-label="Perfil">{PERFIL_LABEL[item.perfil] ?? item.perfil}</td>
                  <td data-label="Status">
                    <Badge tone={item.ativo ? 'success' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td data-label="Ações">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-edit"
                        title="Editar"
                        onClick={() => navigate(`/usuarios/${item.id}/editar`)}
                      >
                        <IconPencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title={item.ativo ? 'Desativar' : 'Reativar'}
                        disabled={atualizandoId === item.id || item.id === usuarioLogado?.id}
                        onClick={() => onAlterarStatus(item)}
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
