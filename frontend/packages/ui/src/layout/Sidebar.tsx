import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { filterMenu, type CanFn, type MainMenuConfig, type MenuItem } from './menu';

export interface SidebarProps {
  menu: MainMenuConfig;
  /** Collapsed = mini rail (72px); expanded = full (264px). */
  collapsed: boolean;
  onToggle: () => void;
  /** Product / brand label shown at the top. */
  brand?: string;
  brandMark?: string;
  /** Permission checker for menu filtering. */
  can?: CanFn;
  /** Translate a menu title key. Defaults to identity. */
  t?: (key: string) => string;
}

const EXPANDED = 264;
const COLLAPSED = 72;

function Item({
  item,
  collapsed,
  t,
  depth = 0,
}: {
  item: MenuItem;
  collapsed: boolean;
  t: (k: string) => string;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children?.length;
  const label = t(item.title);

  if (hasChildren && !collapsed) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-2lg px-3 py-2.5 text-2xs font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center text-base" aria-hidden="true">
            {item.icon}
          </span>
          <span className="flex-1 text-left">{label}</span>
          <span aria-hidden="true" className={cn('transition-transform', open && 'rotate-90')}>
            ›
          </span>
        </button>
        {open && (
          <ul className="mt-1 space-y-0.5 pl-6">
            {item.children!.map((c) => (
              <Item key={c.to} item={c} collapsed={collapsed} t={t} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end ?? item.to === '/'}
        title={collapsed ? label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-2lg px-3 py-2.5 text-2xs font-medium transition-colors',
            collapsed && 'justify-center px-0',
            isActive ? 'bg-primary text-white shadow-card' : 'text-gray-400 hover:bg-white/5 hover:text-white',
          )
        }
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center text-base" aria-hidden="true">
          {item.icon}
        </span>
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
      </NavLink>
    </li>
  );
}

/**
 * Dark collapsible sidebar (#090E14 / dark.800), 264 ⇄ 72px, icon+label, active
 * highlight, permission-filtered config-driven menu (DESIGN-ALIGNMENT §2).
 */
export function Sidebar({ menu, collapsed, onToggle, brand = 'AutoParking', brandMark = 'AP', can, t = (k) => k }: SidebarProps) {
  const items = filterMenu(menu, can);
  return (
    <aside
      className="flex shrink-0 flex-col bg-dark-800 text-white transition-width duration-200"
      style={{ width: collapsed ? COLLAPSED : EXPANDED }}
    >
      <div className={cn('flex h-16 items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2lg bg-primary text-sm font-bold text-white">
          {brandMark}
        </span>
        {!collapsed && <span className="truncate text-base font-semibold">{brand}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <Item key={item.to} item={item} collapsed={collapsed} t={t} />
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex h-11 items-center justify-center gap-2 border-t border-white/10 text-2xs text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <span aria-hidden="true">{collapsed ? '»' : '«'}</span>
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
