import { NavLink } from 'react-router-dom';
import { OrgSwitcher } from './OrgSwitcher';
import {
  IconBlacklist,
  IconDashboard,
  IconLogout,
  IconPartners,
  IconReports,
  IconTariff,
  IconWhitelist,
} from './icons';
import type { ComponentType, SVGProps } from 'react';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const NAV: { to: string; label: string; icon: Icon; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/whitelist', label: 'Oq ro‘yxat', icon: IconWhitelist },
  { to: '/blacklist', label: 'Qora ro‘yxat', icon: IconBlacklist },
  { to: '/tariff', label: 'Tariflar', icon: IconTariff },
  { to: '/reports', label: 'Hisobotlar', icon: IconReports },
  { to: '/partners', label: 'Hamkorlar', icon: IconPartners },
];

export function Sidebar({ user, onLogout }: { user: { name: string; email?: string }; onLogout: () => void }) {
  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-2lg bg-primary text-sm font-black text-white">
          AP
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold text-gray-800">AutoParking</span>
          <span className="text-exs font-medium uppercase tracking-[0.16em] text-primary">Business</span>
        </span>
      </div>

      <div className="px-3">
        <OrgSwitcher />
      </div>

      {/* nav */}
      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'group flex items-center gap-3 rounded-2lg px-3 py-2.5 text-sm font-medium transition-colors ' +
              (isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700')
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* user */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 rounded-2lg px-2 py-1.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-50 text-2xs font-bold text-primary-700">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-2xs font-semibold text-gray-700">{user.name}</span>
            {user.email && <span className="block truncate text-exs text-gray-400">{user.email}</span>}
          </span>
          <button
            type="button"
            onClick={onLogout}
            title="Chiqish"
            className="grid h-8 w-8 place-items-center rounded-2lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-error"
          >
            <IconLogout width={18} height={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
