import { useState, type FormEvent } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Link, useNavigate } from '../lib/router';

export function RegisterPage() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      await cadastrar(nome, email, senha, nomeEmpresa);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível criar a conta. Tente novamente.');
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
          label="Nome da Empresa"
          name="nomeEmpresa"
          required
          value={nomeEmpresa}
          onChange={(event) => setNomeEmpresa(event.target.value)}
        />
        <Input
          label="Seu nome"
          name="nome"
          required
          value={nome}
          onChange={(event) => setNome(event.target.value)}
        />
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
          autoComplete="new-password"
          required
          hint="Mínimo de 8 caracteres"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
        />
        <Button type="submit" loading={carregando}>
          Criar conta
        </Button>
      </form>
      <div className="auth-footer">
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </div>
    </AuthLayout>
  );
}
