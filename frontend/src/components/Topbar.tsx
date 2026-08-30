import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from '../lib/router';
import { initials, PERFIL_LABEL } from '../lib/format';
import { IconChevronDown, IconLogOut, IconMenu, IconSettings } from './Icon';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { usuario, sair } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!usuario) return null;

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu-btn" onClick={onOpenMenu} aria-label="Abrir menu">
        <IconMenu size={20} />
      </button>

      <div className="topbar-spacer" />

      <div className="user-menu" ref={ref}>
        <button type="button" className="user-menu-trigger" onClick={() => setOpen((v) => !v)}>
          <span className="avatar">{initials(usuario.nome)}</span>
          <span className="user-menu-name">{usuario.nome}</span>
          <IconChevronDown size={16} />
        </button>

        {open && (
          <div className="user-menu-dropdown" role="menu">
            <div className="user-menu-info">
              <strong>{usuario.nome}</strong>
              <span>{usuario.email}</span>
              <span className="user-menu-perfil">{PERFIL_LABEL[usuario.perfil] ?? usuario.perfil}</span>
            </div>
            <Link to="/configuracoes" className="user-menu-item" onClick={() => setOpen(false)}>
              <IconSettings size={16} /> Configurações
            </Link>
            <button type="button" className="user-menu-item user-menu-item-danger" onClick={sair}>
              <IconLogOut size={16} /> Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
