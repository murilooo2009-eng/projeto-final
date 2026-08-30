import { useAuth } from '../context/AuthContext';
import { PERFIL_LABEL } from '../lib/format';
import { Button } from '../components/Button';
import { IconLogOut } from '../components/Icon';

export function ConfiguracoesPage() {
  const { usuario, sair } = useAuth();

  if (!usuario) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Informações da sua conta.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 className="card-title">Sua conta</h2>
        <div className="form-grid">
          <div className="field">
            <span className="field-label">Nome</span>
            <span>{usuario.nome}</span>
          </div>
          <div className="field">
            <span className="field-label">E-mail</span>
            <span>{usuario.email}</span>
          </div>
          <div className="field">
            <span className="field-label">Perfil</span>
            <span>{PERFIL_LABEL[usuario.perfil] ?? usuario.perfil}</span>
          </div>
        </div>
        <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 20 }}>
          <Button variant="secondary" icon={<IconLogOut size={16} />} onClick={sair}>
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
