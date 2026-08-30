import type { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocationPath } from '../lib/router';
import { IconChecklist, IconDashboard, IconPlay, IconSettings, IconUsers } from './Icon';

interface NavItem {
  to: string;
  label: string;
  icon: (props: { size?: number }) => ReactElement;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/checklists', label: 'Checklists', icon: IconChecklist },
  { to: '/execucoes', label: 'Execuções', icon: IconPlay },
  { to: '/usuarios', label: 'Usuários', icon: IconUsers, adminOnly: true },
  { to: '/configuracoes', label: 'Configurações', icon: IconSettings },
];

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { usuario } = useAuth();
  const path = useLocationPath();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || usuario?.perfil === 'ADMIN');

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onNavigate} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-title">Sistema de Checklists</span>
        </div>
        <nav className="sidebar-nav">
          {items.map((item) => {
            const active = path === item.to || path.startsWith(`${item.to}/`);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}
              >
                <ItemIcon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
