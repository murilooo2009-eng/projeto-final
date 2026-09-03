import { useEffect, type ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from '../lib/router';

export function GuestRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return children;
}
