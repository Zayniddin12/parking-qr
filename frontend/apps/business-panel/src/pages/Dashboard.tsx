import { useEffect, useState } from 'react';
import {
  PageHeader,
  DateFilterTabs,
  Table,
  NoData,
  type DateRange,
  type TableColumn,
} from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { useQuery } from '@tanstack/react-query';
import { BranchSelect } from '../components/BranchSelect';
import { StatCard, ErrorState, Plate } from '../components/common';
import { RevenueChart } from '../components/RevenueChart';
import { useBranches, useDashboard, qk } from '../lib/hooks';
import { api } from '../lib/api';
import { formatTiyin, formatUZS } from '../lib/money';
import type { TopPlate, UUID } from '../lib/apiTypes';

/**
 * Operator dashboard: per-branch KPI tiles, a date-filtered revenue summary
 * (gross/net/unmatched from the settlement ledger), a daily revenue chart and a
 * top-plates table — all from the Management reporting endpoints, tenant-scoped.
 */
export function Dashboard() {
  const { t } = useTranslation();
  const { data: branches } = useBranches();
  const [branchId, setBranchId] = useState<UUID | undefined>(undefined);
  const [range, setRange] = useState<DateRange | null>(null);

  // Default to the first branch once branches load.
  useEffect(() => {
    const first = branches?.[0];
    if (!branchId && first) setBranchId(first.id);
  }, [branches, branchId]);

  const dash = useDashboard(branchId);
  const revenue = useQuery({
    queryKey: [...qk.dashboard(branchId ?? 'none'), 'revenue', range?.from, range?.to],
    queryFn: () => api.revenueReport(branchId!, range?.from, range?.to),
    enabled: !!branchId,
  });

  const topPlateCols: TableColumn<TopPlate>[] = [
    { key: 'plate', label: t('bp.dashboard.plate'), render: (r) => <Plate value={r.plate} /> },
    { key: 'country', label: t('bp.lists.country'), render: (r) => r.country?.toUpperCase() ?? '—' },
    { key: 'visits', label: t('bp.dashboard.visits'), align: 'right', render: (r) => r.visits },
    {
      key: 'revenue',
      label: t('bp.dashboard.revenue'),
      align: 'right',
      render: (r) => formatTiyin(r.revenue_tiyin),
    },
  ];

  const d = dash.data;

  return (
    <div>
      <PageHeader
        title={t('menu.dashboard')}
        subtitle={range ? `${range.from} → ${range.to}` : t('bp.dashboard.revenueToday')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BranchSelect value={branchId} onChange={setBranchId} />
            <DateFilterTabs onChange={setRange} />
          </div>
        }
      />

      {branches && branches.length === 0 ? (
        <NoData title={t('bp.dashboard.noBranch')} />
      ) : dash.isError ? (
        <ErrorState error={dash.error} onRetry={() => void dash.refetch()} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('bp.dashboard.revenueToday')}
              value={formatUZS(d?.revenue_today_tiyin)}
              sub={t('bp.dashboard.revenueMonth') + ': ' + formatUZS(d?.revenue_month_tiyin)}
              tone="success"
            />
            <StatCard
              label={t('bp.dashboard.openVisits')}
              value={d?.open_visits ?? '—'}
              sub={t('bp.dashboard.visitsToday') + ': ' + (d?.visits_today ?? '—')}
              tone="primary"
            />
            <StatCard
              label={t('bp.dashboard.activePermits')}
              value={d?.active_permits ?? '—'}
              sub={t('bp.dashboard.devices') + ': ' + (d?.devices ?? '—')}
              tone="info"
            />
            <StatCard
              label={t('bp.dashboard.blacklist')}
              value={d?.blacklist_entries ?? '—'}
              sub={t('bp.dashboard.branches') + ': ' + (d?.branches ?? '—')}
              tone="warning"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={t('bp.payments.gross')}
              value={formatUZS(revenue.data?.gross_tiyin)}
              tone="primary"
            />
            <StatCard
              label={t('bp.payments.net')}
              value={formatUZS(revenue.data?.net_tiyin)}
              tone="success"
            />
            <StatCard
              label={t('bp.payments.unmatched')}
              value={revenue.data?.unmatched_exits ?? '—'}
              tone="warning"
            />
          </div>

          <div className="mb-6 rounded-2lg border border-gray-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              {t('bp.dashboard.revenueByDay')}
            </h2>
            <RevenueChart data={d?.revenue_by_day ?? []} />
          </div>

          <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('bp.dashboard.topPlates')}</h2>
          <Table<TopPlate>
            head={topPlateCols}
            data={d?.top_plates ?? []}
            loading={dash.isLoading}
            rowKey={(r) => r.plate}
            emptyTitle={t('panel.empty')}
          />
        </>
      )}
    </div>
  );
}
