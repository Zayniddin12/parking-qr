import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, useClaims } from '@autoparking/auth';
import { config } from '../config';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const TITLES: { match: (p: string) => boolean; title: string; subtitle?: string }[] = [
  { match: (p) => p === '/', title: 'Dashboard', subtitle: 'Umumiy ko‘rsatkichlar' },
  { match: (p) => p.startsWith('/whitelist'), title: 'Oq ro‘yxat', subtitle: 'Ruxsat etilgan avtoraqamlar' },
  { match: (p) => p.startsWith('/blacklist'), title: 'Qora ro‘yxat', subtitle: 'Bloklangan avtoraqamlar' },
  { match: (p) => p.startsWith('/tariff'), title: 'Tariflar', subtitle: 'Narx rejalari' },
  { match: (p) => p.startsWith('/reports'), title: 'Hisobotlar', subtitle: 'Tahlil va statistika' },
  { match: (p) => p.startsWith('/partners'), title: 'Hamkorlar', subtitle: 'QR chek beruvchi hamkorlar' },
];

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const auth = useAuth();
  const claims = useClaims();
  const meta: { title: string; subtitle?: string } =
    TITLES.find((t) => t.match(pathname)) ?? { title: 'AutoParking' };

  const user = {
    name: claims.name ?? claims.email ?? 'Operator',
    email: claims.email,
  };
  const onLogout = () => {
    if (config.authDisabled) return;
    void auth.signoutRedirect();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
