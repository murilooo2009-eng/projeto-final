import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { GuestRoute } from './components/GuestRoute';
import { Route, Routes, useNavigate } from './lib/router';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChecklistsPage } from './pages/ChecklistsPage';
import { ChecklistFormPage } from './pages/ChecklistFormPage';
import { ChecklistItemsPage } from './pages/ChecklistItemsPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { ExecucoesPage } from './pages/ExecucoesPage';
import { ExecucaoRunPage } from './pages/ExecucaoRunPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { UsuarioFormPage } from './pages/UsuarioFormPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
  }, [isAuthenticated, navigate]);

  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/registrar"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checklists"
        element={
          <ProtectedRoute>
            <ChecklistsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/novo"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <ChecklistFormPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id/editar"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <ChecklistFormPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id/itens"
        element={
          <ProtectedRoute>
            <ChecklistItemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id/itens/novo"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <ItemFormPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id/itens/:itemId/editar"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <ItemFormPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/execucoes"
        element={
          <ProtectedRoute>
            <ExecucoesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/execucoes/:id/executar"
        element={
          <ProtectedRoute>
            <ExecucaoRunPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <UsuariosPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/novo"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <UsuarioFormPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios/:id/editar"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['ADMIN']}>
              <UsuarioFormPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <ConfiguracoesPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
