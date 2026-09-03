import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Toggle } from '../components/Toggle';
import { ApiError } from '../lib/api';
import { Link, useNavigate, useParams } from '../lib/router';
import { atualizarItem, buscarChecklist, criarItem } from '../services/checklists';

export function ItemFormPage() {
  const { id, itemId } = useParams();
  const checklistId = Number(id);
  const editandoId = itemId ? Number(itemId) : null;
  const navigate = useNavigate();

  const [checklistTitulo, setChecklistTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState('');
  const [obrigatorio, setObrigatorio] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const checklist = await buscarChecklist(checklistId);
      setChecklistTitulo(checklist.titulo);
      if (editandoId) {
        const item = checklist.itens.find((i) => i.id === editandoId);
        if (item) {
          setDescricao(item.descricao);
          setOrdem(String(item.ordem));
          setObrigatorio(item.obrigatorio);
        }
      }
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o checklist.');
    } finally {
      setCarregando(false);
    }
  }, [checklistId, editandoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!descricao.trim()) {
      setErro('Informe a descrição do item.');
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      const dto = { descricao, obrigatorio, ordem: ordem ? Number(ordem) : undefined };
      if (editandoId) {
        await atualizarItem(checklistId, editandoId, dto);
      } else {
        await criarItem(checklistId, dto);
      }
      navigate(`/checklists/${checklistId}/itens`);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o item.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/checklists">Checklists</Link>
        <span>/</span>
        <Link to={`/checklists/${checklistId}/itens`}>{checklistTitulo || 'Itens'}</Link>
        <span>/</span>
        <span>{editandoId ? 'Editar Item' : 'Novo Item'}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{editandoId ? 'Editar Item' : 'Novo Item'}</h1>
        </div>
      </div>

      {erro && <ErrorBanner message={erro} onRetry={carregar} />}

      {carregando ? (
        <LoadingState label="Carregando…" />
      ) : (
        <form className="card" style={{ maxWidth: 460 }} onSubmit={onSubmit}>
          <div className="form-grid">
            <Input
              label="Descrição"
              name="descricao"
              required
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
            <Input
              label="Ordem"
              name="ordem"
              type="number"
              min={1}
              hint="Deixe em branco para adicionar ao final"
              value={ordem}
              onChange={(event) => setOrdem(event.target.value)}
            />
            <Toggle label="Obrigatório" checked={obrigatorio} onChange={setObrigatorio} />
            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <Button type="submit" loading={salvando}>
                Salvar
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/checklists/${checklistId}/itens`)}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
