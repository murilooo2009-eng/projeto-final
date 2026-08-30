import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Select } from '../components/Select';
import { ApiError } from '../lib/api';
import { Link, useNavigate, useParams } from '../lib/router';
import { atualizarUsuario, buscarUsuario, criarUsuario } from '../services/usuarios';
import type { Perfil } from '../types';

export function UsuarioFormPage() {
  const { id } = useParams();
  const editandoId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('COLABORADOR');

  const [carregando, setCarregando] = useState(Boolean(editandoId));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!editandoId) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarUsuario(editandoId);
      setNome(dados.nome);
      setEmail(dados.email);
      setPerfil(dados.perfil);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o usuário.');
    } finally {
      setCarregando(false);
    }
  }, [editandoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (!editandoId && senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setSalvando(true);
    try {
      if (editandoId) {
        await atualizarUsuario(editandoId, { nome, email, perfil, senha: senha || undefined });
      } else {
        await criarUsuario({ nome, email, senha, perfil });
      }
      navigate('/usuarios');
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o usuário.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/usuarios">Usuários</Link>
        <span>/</span>
        <span>{editandoId ? 'Editar' : 'Novo'}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{editandoId ? 'Editar Usuário' : 'Novo Usuário'}</h1>
          <p className="page-subtitle">
            {editandoId ? 'Atualize os dados do colaborador.' : 'Cadastre um novo colaborador com acesso ao sistema.'}
          </p>
        </div>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={editandoId ? carregar : undefined} />}

      {carregando ? (
        <LoadingState label="Carregando usuário…" />
      ) : (
        <form className="card" style={{ maxWidth: 460 }} onSubmit={onSubmit}>
          <div className="form-grid">
            <Input label="Nome" name="nome" required value={nome} onChange={(event) => setNome(event.target.value)} />
            <Input
              label="E-mail"
              type="email"
              name="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Senha"
              type="password"
              name="senha"
              hint={editandoId ? 'Deixe em branco para manter a senha atual' : 'Mínimo de 8 caracteres'}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
            <Select label="Perfil" value={perfil} onChange={(event) => setPerfil(event.target.value as Perfil)}>
              <option value="COLABORADOR">Colaborador</option>
              <option value="ADMIN">Administrador</option>
            </Select>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={() => navigate('/usuarios')}>
                Cancelar
              </Button>
              <Button type="submit" loading={salvando}>
                {editandoId ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
