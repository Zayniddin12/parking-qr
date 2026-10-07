import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { partnersStore } from '../lib/partnersStore';
import { StatCard } from '../components/common';

const DAY = 86_400_000;
const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export function ReportsPage() {
  const agg = useQuery({
    queryKey: ['dash-agg'],
    queryFn: async () => {
      const partners = await partnersStore.list();
      const perPartner = await Promise.all(
        partners.map(async (p) => ({ p, checks: await partnersStore.checks(p.id) })),
      );
      return perPartner;
    },
  });

  const rows = agg.data ?? [];
  const allChecks = rows.flatMap((r) => r.checks);

  const last7 = useMemo(() => {
    const now = Date.now();
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * DAY);
      return { label: WEEKDAYS[d.getDay()]!, count: 0 };
    });
    for (const c of allChecks) {
      const ageDays = Math.floor((now - new Date(c.createdAt).getTime()) / DAY);
      if (ageDays >= 0 && ageDays < 7) buckets[6 - ageDays]!.count += 1;
    }
    return buckets;
  }, [allChecks]);

  const weekTotal = last7.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(1, ...last7.map((b) => b.count));
  const topPartners = [...rows].sort((a, b) => b.checks.length - a.checks.length).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Jami cheklar" value={allChecks.length} tone="primary" />
        <StatCard label="So‘nggi 7 kun" value={weekTotal} tone="info" />
        <StatCard label="Faol hamkorlar" value={rows.length} tone="success" />
      </div>

      <div className="rounded-2lg border border-gray-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-gray-700">Cheklar — so‘nggi 7 kun</h2>
        <div className="mt-6 flex h-44 items-stretch justify-between gap-3">
          {last7.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-primary-500 transition-all"
                  style={{ height: `${Math.max(4, (b.count / maxCount) * 100)}%`, opacity: 0.55 + 0.45 * (b.count / maxCount) }}
                  title={`${b.count}`}
                />
              </div>
              <span className="text-exs font-semibold text-gray-600">{b.count}</span>
              <span className="text-exs text-gray-400">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2lg border border-gray-200 bg-white shadow-card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">Eng faol hamkorlar</h2>
        </div>
        {topPartners.length === 0 ? (
          <div className="px-5 py-10 text-center text-2xs text-gray-400">Ma’lumot yo‘q</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {topPartners.map(({ p, checks }, i) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-2xs font-bold text-gray-500">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">{p.name}</span>
                <span className="rounded-md bg-primary-50 px-2 py-0.5 font-mono text-exs font-semibold text-primary-700">
                  {p.key}
                </span>
                <span className="text-sm font-semibold text-gray-700">{checks.length}</span>
                <span className="text-exs text-gray-400">chek</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
