import { useState } from 'react';
import { PageHeader, Table, Badge, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState, Tabs } from '../components/common';
import { healthPill } from '../components/status';
import { BranchSelect } from '../components/BranchSelect';
import { useDevices, useEdgeNodes } from '../lib/hooks';
import { formatDateTime, shortId, timeAgo } from '../lib/format';
import type { DeviceOut, EdgeNodeOut, UUID } from '../lib/apiTypes';

type Tab = 'devices' | 'edge';

const LICENSE_TONE = {
  active: 'success',
  grace: 'warning',
  unprovisioned: 'neutral',
  revoked: 'danger',
  expired: 'danger',
} as const;

/** Devices/cameras + edge nodes (status, health, last-seen). Filter by branch. */
export function DevicesPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('devices');
  const [branchId, setBranchId] = useState<UUID | undefined>();

  const devices = useDevices(branchId);
  const edges = useEdgeNodes(branchId);

  const deviceCols: TableColumn<DeviceOut>[] = [
    { key: 'name', label: t('bp.branches.name'), render: (d) => d.name },
    { key: 'type', label: t('bp.devices.type'), render: (d) => d.type },
    { key: 'ip', label: t('bp.devices.ip'), render: (d) => d.ip ?? '—' },
    { key: 'branch', label: t('bp.common.branch'), render: (d) => shortId(d.branch_id) },
    { key: 'health', label: t('bp.devices.health'), render: (d) => healthPill(d.health) },
    { key: 'last_seen', label: t('bp.devices.lastSeen'), align: 'right', render: (d) => timeAgo(d.last_seen) },
  ];

  const edgeCols: TableColumn<EdgeNodeOut>[] = [
    { key: 'hardware_id', label: t('bp.devices.hardware'), render: (e) => e.hardware_id },
    { key: 'branch', label: t('bp.common.branch'), render: (e) => shortId(e.branch_id) },
    { key: 'fw', label: t('bp.devices.firmware'), render: (e) => e.fw_version ?? '—' },
    {
      key: 'license',
      label: t('bp.devices.license'),
      render: (e) => <Badge tone={LICENSE_TONE[e.license_state]}>{e.license_state}</Badge>,
    },
    { key: 'last_seen', label: t('bp.devices.lastSeen'), align: 'right', render: (e) => formatDateTime(e.last_seen) },
  ];

  return (
    <div>
      <PageHeader
        title={t('bp.devices.title')}
        actions={<BranchSelect value={branchId} onChange={setBranchId} allowAll />}
      />
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'devices', label: t('bp.devices.cameras') },
          { key: 'edge', label: t('bp.devices.edgeNodes') },
        ]}
      />

      {tab === 'devices' ? (
        devices.isError ? (
          <ErrorState error={devices.error} onRetry={() => void devices.refetch()} />
        ) : (
          <Table<DeviceOut>
            head={deviceCols}
            data={devices.data ?? []}
            loading={devices.isLoading}
            rowKey={(d) => d.id}
            emptyTitle={t('panel.empty')}
          />
        )
      ) : edges.isError ? (
        <ErrorState error={edges.error} onRetry={() => void edges.refetch()} />
      ) : (
        <Table<EdgeNodeOut>
          head={edgeCols}
          data={edges.data ?? []}
          loading={edges.isLoading}
          rowKey={(e) => e.id}
          emptyTitle={t('panel.empty')}
        />
      )}
    </div>
  );
}
