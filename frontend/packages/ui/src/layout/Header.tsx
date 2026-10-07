import { useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Avatar } from '../components/Avatar';
import { Breadcrumb, type Crumb } from '../components/Breadcrumb';
import { LanguageSwitcher, type LangCode } from './LanguageSwitcher';

export interface HeaderUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface HeaderProps {
  breadcrumbs?: Crumb[];
  lang: LangCode;
  onLangChange: (lang: LangCode) => void;
  user?: HeaderUser;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  /** Extra content injected before the language switcher. */
  slot?: ReactNode;
  logoutLabel?: string;
}

/** Sticky top header: breadcrumbs · language switcher · user dropdown. */
export function Header({
  breadcrumbs,
  lang,
  onLangChange,
  user,
  onLogout,
  onToggleSidebar,
  slot,
  logoutLabel = 'Log out',
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6 shadow-header">
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-2lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
        >
          ☰
        </button>
      )}
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      </div>

      {slot}

      <LanguageSwitcher value={lang} onChange={onLangChange} />

      {user && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-2lg py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
          >
            <Avatar name={user.name} src={user.avatarUrl} />
            <span className="hidden text-2xs font-medium text-gray-700 sm:block">{user.name}</span>
            <span aria-hidden="true" className="text-gray-400">
              ▾
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-2lg border border-gray-200 bg-white shadow-card"
              >
                <div className="border-b border-gray-200 px-4 py-3">
                  <div className="truncate text-2xs font-semibold text-gray-700">{user.name}</div>
                  {user.email && <div className="truncate text-exs text-gray-500">{user.email}</div>}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                  className={cn('flex w-full items-center gap-2 px-4 py-2.5 text-2xs text-red-600 transition-colors hover:bg-red-50')}
                >
                  <span aria-hidden="true">⏻</span>
                  {logoutLabel}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
