import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { ApiError } from '../lib/api';
import { Link, useNavigate, useParams } from '../lib/router';
import { atualizarChecklist, buscarChecklist, criarChecklist } from '../services/checklists';
import type { Periodicidade } from '../types';

export function ChecklistFormPage() {
  const { id } = useParams();
  const editandoId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState('');
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('DIARIO');
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState(Boolean(editandoId));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!editandoId) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarChecklist(editandoId);
      setTitulo(dados.titulo);
      setPeriodicidade(dados.periodicidade);
      setAtivo(dados.ativo);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o checklist.');
    } finally {
      setCarregando(false);
    }
  }, [editandoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!titulo.trim()) {
      setErro('Informe o título do checklist.');
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      if (editandoId) {
        await atualizarChecklist(editandoId, { titulo, periodicidade, ativo });
      } else {
        await criarChecklist({ titulo, periodicidade });
      }
      navigate('/checklists');
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o checklist.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/checklists">Checklists</Link>
        <span>/</span>
        <span>{editandoId ? 'Editar' : 'Novo'}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{editandoId ? 'Editar Checklist' : 'Novo Checklist'}</h1>
        </div>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={editandoId ? carregar : undefined} />}

      {carregando ? (
        <LoadingState label="Carregando checklist…" />
      ) : (
        <form className="card" style={{ maxWidth: 460 }} onSubmit={onSubmit}>
          <div className="form-grid">
            <Input label="Título" name="titulo" required value={titulo} onChange={(event) => setTitulo(event.target.value)} />
            <Select
              label="Periodicidade"
              name="periodicidade"
              value={periodicidade}
              onChange={(event) => setPeriodicidade(event.target.value as Periodicidade)}
            >
              <option value="DIARIO">Diário</option>
              <option value="SEMANAL">Semanal</option>
            </Select>
            {editandoId && <Toggle label="Ativo" checked={ativo} onChange={setAtivo} />}
            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <Button type="submit" loading={salvando}>
                Salvar
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate('/checklists')}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
