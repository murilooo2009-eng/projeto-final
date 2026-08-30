import { Button } from '../components/Button';
import { useNavigate } from '../lib/router';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="not-found-page">
      <h1 className="page-title">Página não encontrada</h1>
      <p className="page-subtitle">O endereço acessado não existe ou foi movido.</p>
      <Button onClick={() => navigate('/dashboard')}>Voltar ao início</Button>
    </div>
  );
}
