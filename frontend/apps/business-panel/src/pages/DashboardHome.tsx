import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { partnersStore } from '../lib/partnersStore';
import { listsStore } from '../lib/listsStore';
import { PartnerLogo } from '../components/PartnerLogo';
import { formatDate } from '../lib/format';
import {
  IconBlacklist,
  IconPartners,
  IconReports,
  IconWhitelist,
} from '../layout/icons';

const DAY = 86_400_000;

function KpiCard({
  label,
  value,
  icon,
  tint,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tint: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2lg border border-gray-200 bg-white p-5 text-left shadow-card transition-shadow hover:shadow-header"
    >
      <span className={'grid h-12 w-12 shrink-0 place-items-center rounded-2lg ' + tint}>{icon}</span>
      <span className="flex flex-col">
        <span className="text-3.5xl font-bold leading-none text-gray-800">{value}</span>
        <span className="mt-1 text-2xs font-medium text-gray-500">{label}</span>
      </span>
    </button>
  );
}

export function DashboardHome() {
  const navigate = useNavigate();

  const agg = useQuery({
    queryKey: ['dash-agg'],
    queryFn: async () => {
      const partners = await partnersStore.list();
      const checks = (await Promise.all(partners.map((p) => partnersStore.checks(p.id)))).flat();
      return { partners, checks };
    },
  });
  const white = useQuery({ queryKey: ['demo-lists', 'whitelist'], queryFn: () => listsStore.list('whitelist') });
  const black = useQuery({ queryKey: ['demo-lists', 'blacklist'], queryFn: () => listsStore.list('blacklist') });

  const partners = agg.data?.partners ?? [];

  const todayChecks = useMemo(() => {
    const list = agg.data?.checks ?? [];
    const now = Date.now();
    return list.filter((c) => now - new Date(c.createdAt).getTime() <= DAY).length;
  }, [agg.data]);

  const wl = white.data?.length ?? 0;
  const bl = black.data?.length ?? 0;
  const total = Math.max(1, wl + bl);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Hamkorlar"
          value={partners.length}
          tint="bg-primary-50 text-primary-600"
          icon={<IconPartners width={24} height={24} />}
          onClick={() => navigate('/partners')}
        />
        <KpiCard
          label="Bugungi cheklar"
          value={todayChecks}
          tint="bg-info-50 text-info-600"
          icon={<IconReports width={24} height={24} />}
          onClick={() => navigate('/reports')}
        />
        <KpiCard
          label="Oq ro‘yxat"
          value={wl}
          tint="bg-green-50 text-green-600"
          icon={<IconWhitelist width={24} height={24} />}
          onClick={() => navigate('/whitelist')}
        />
        <KpiCard
          label="Qora ro‘yxat"
          value={bl}
          tint="bg-red-50 text-error"
          icon={<IconBlacklist width={24} height={24} />}
          onClick={() => navigate('/blacklist')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* recent partners */}
        <div className="lg:col-span-2 rounded-2lg border border-gray-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700">So‘nggi hamkorlar</h2>
            <button
              type="button"
              onClick={() => navigate('/partners')}
              className="text-2xs font-medium text-primary hover:underline"
            >
              Hammasi →
            </button>
          </div>
          {partners.length === 0 ? (
            <div className="px-5 py-10 text-center text-2xs text-gray-400">Hamkor yo‘q</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {partners.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/partners/${p.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <PartnerLogo name={p.name} src={p.logoUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-700">{p.name}</div>
                      <div className="text-exs text-gray-400">{p.email}</div>
                    </div>
                    <span className="rounded-md bg-primary-50 px-2 py-0.5 font-mono text-exs font-semibold text-primary-700">
                      {p.key}
                    </span>
                    <span className="hidden text-exs text-gray-400 sm:block">{formatDate(p.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* lists split */}
        <div className="rounded-2lg border border-gray-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-gray-700">Ro‘yxatlar</h2>
          <div className="mt-5 flex flex-col gap-4">
            <Bar label="Oq ro‘yxat" value={wl} total={total} color="bg-green-500" />
            <Bar label="Qora ro‘yxat" value={bl} total={total} color="bg-error" />
          </div>
          <div className="mt-6 rounded-2lg bg-gray-100 px-4 py-3 text-2xs text-gray-500">
            Jami <span className="font-semibold text-gray-700">{wl + bl}</span> ta avtoraqam nazoratda.
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-2xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-700">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={'h-full rounded-full ' + color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
