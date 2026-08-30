import { useState, type FormEvent } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Link, useNavigate } from '../lib/router';

export function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await entrar(email, senha);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Sistema de Checklists</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        {erro && <div className="form-error">{erro}</div>}
        <Input
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Senha"
          type="password"
          name="senha"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
        />
        <Button type="submit" loading={carregando}>
          Entrar
        </Button>
      </form>
      <div className="auth-footer">
        Não tem uma conta? <Link to="/registrar">Criar conta</Link>
      </div>
    </AuthLayout>
  );
}
