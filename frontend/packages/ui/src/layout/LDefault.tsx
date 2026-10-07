import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header, type HeaderUser } from './Header';
import type { CanFn, MainMenuConfig } from './menu';
import type { LangCode } from './LanguageSwitcher';
import type { Crumb } from '../components/Breadcrumb';

export interface LDefaultProps {
  menu: MainMenuConfig;
  children: ReactNode;
  breadcrumbs?: Crumb[];
  brand?: string;
  brandMark?: string;
  can?: CanFn;
  t?: (key: string) => string;
  lang: LangCode;
  onLangChange: (lang: LangCode) => void;
  user?: HeaderUser;
  onLogout?: () => void;
  /** Start collapsed (persisted state can be lifted by the app). */
  defaultCollapsed?: boolean;
  headerSlot?: ReactNode;
}

/**
 * Authenticated app shell (DESIGN-ALIGNMENT §2): dark collapsible sidebar
 * (264 ⇄ 72px) + sticky header (breadcrumb · language switcher · user menu),
 * scrollable main region on the app background.
 */
export function LDefault({
  menu,
  children,
  breadcrumbs,
  brand,
  brandMark,
  can,
  t,
  lang,
  onLangChange,
  user,
  onLogout,
  defaultCollapsed = false,
  headerSlot,
}: LDefaultProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-app font-sans">
      <Sidebar
        menu={menu}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        brand={brand}
        brandMark={brandMark}
        can={can}
        t={t}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          breadcrumbs={breadcrumbs}
          lang={lang}
          onLangChange={onLangChange}
          user={user}
          onLogout={onLogout}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          slot={headerSlot}
        />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
