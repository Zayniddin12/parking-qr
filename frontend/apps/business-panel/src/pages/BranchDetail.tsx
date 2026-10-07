import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, Table, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { DescriptionList, ErrorState, Tabs } from '../components/common';
import { branchStatusPill, healthPill } from '../components/status';
import { useBranch, useBranchRatePlans, useBranchDevices } from '../lib/hooks';
import { formatDateTime, shortId } from '../lib/format';
import type { DeviceOut, RatePlanOut, UUID } from '../lib/apiTypes';

type Tab = 'overview' | 'ratePlans' | 'devices';

/** Branch detail with overview / rate-plan history / device tabs. */
export function BranchDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: UUID }>();
  const [tab, setTab] = useState<Tab>('overview');

  const branch = useBranch(id);
  const plans = useBranchRatePlans(tab === 'ratePlans' ? id : undefined);
  const devices = useBranchDevices(tab === 'devices' ? id : undefined);

  const planCols: TableColumn<RatePlanOut>[] = [
    { key: 'version', label: t('bp.tariffs.version'), align: 'right', render: (p) => `v${p.version}` },
    { key: 'currency', label: t('bp.tariffs.currency'), render: (p) => p.currency },
    { key: 'status', label: t('bp.common.status'), render: (p) => p.status },
    {
      key: 'effective_from',
      label: t('bp.tariffs.effectiveFrom'),
      render: (p) => formatDateTime(p.effective_from),
    },
    {
      key: 'signature',
      label: t('bp.tariffs.signature'),
      render: (p) => (p.signature ? shortId(p.signature) : '—'),
    },
  ];

  const deviceCols: TableColumn<DeviceOut>[] = [
    { key: 'name', label: t('bp.branches.name'), render: (dv) => dv.name },
    { key: 'type', label: t('bp.devices.type'), render: (dv) => dv.type },
    { key: 'ip', label: t('bp.devices.ip'), render: (dv) => dv.ip ?? '—' },
    { key: 'health', label: t('bp.devices.health'), render: (dv) => healthPill(dv.health) },
  ];

  const b = branch.data;

  return (
    <div>
      <PageHeader
        title={b?.name ?? t('bp.branches.title')}
        subtitle={b ? shortId(b.id) : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/branches')}>
            {t('common.back')}
          </Button>
        }
      />

      {branch.isError ? (
        <ErrorState error={branch.error} onRetry={() => void branch.refetch()} />
      ) : (
        <>
          <Tabs<Tab>
            active={tab}
            onChange={setTab}
            tabs={[
              { key: 'overview', label: t('bp.branches.tabs.overview') },
              { key: 'ratePlans', label: t('bp.branches.tabs.ratePlans') },
              { key: 'devices', label: t('bp.branches.tabs.devices') },
            ]}
          />

          {tab === 'overview' && (
            <div className="rounded-2lg border border-gray-200 bg-white p-6 shadow-card">
              <DescriptionList
                items={[
                  { label: t('bp.branches.name'), value: b?.name },
                  { label: t('bp.common.status'), value: branchStatusPill(b?.status) },
                  { label: t('bp.branches.address'), value: b?.address ?? '—' },
                  { label: t('bp.branches.timezone'), value: b?.timezone },
                  { label: t('bp.branches.billing'), value: b?.billing_status },
                  {
                    label: t('bp.branches.ratePlan'),
                    value: b?.active_rate_plan_id ? shortId(b.active_rate_plan_id) : '—',
                  },
                ]}
              />
            </div>
          )}

          {tab === 'ratePlans' &&
            (plans.isError ? (
              <ErrorState error={plans.error} onRetry={() => void plans.refetch()} />
            ) : (
              <Table<RatePlanOut>
                head={planCols}
                data={plans.data ?? []}
                loading={plans.isLoading}
                rowKey={(p) => p.id}
                emptyTitle={t('panel.empty')}
              />
            ))}

          {tab === 'devices' &&
            (devices.isError ? (
              <ErrorState error={devices.error} onRetry={() => void devices.refetch()} />
            ) : (
              <Table<DeviceOut>
                head={deviceCols}
                data={devices.data ?? []}
                loading={devices.isLoading}
                rowKey={(dv) => dv.id}
                emptyTitle={t('panel.empty')}
              />
            ))}
        </>
      )}
    </div>
  );
}
