import type { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { AppLayout } from './AppLayout';

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return <AppLayout>{children}</AppLayout>;
}
