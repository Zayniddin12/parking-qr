import { PageHeader, Table, Badge, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { useClaims } from '@autoparking/auth';
import { DescriptionList, ErrorState } from '../components/common';
import { useMe, useRoles } from '../lib/hooks';
import { shortId } from '../lib/format';
import type { RoleInfo } from '../lib/apiTypes';

/**
 * Users/members. Human identity lives in Keycloak, so this is a read-only
 * reflection of the verified JWT principal (`/members/me`) plus the coarse role
 * catalogue (`/members/roles`) the panels render.
 */
export function UsersPage() {
  const { t } = useTranslation();
  const claims = useClaims();
  const me = useMe();
  const roles = useRoles();

  const roleCols: TableColumn<RoleInfo>[] = [
    { key: 'label', label: t('bp.users.role'), render: (r) => r.label },
    { key: 'value', label: 'value', render: (r) => <span className="font-mono text-2xs">{r.value}</span> },
    {
      key: 'held',
      label: t('bp.common.status'),
      render: (r) =>
        me.data?.roles.includes(r.value) ? <Badge tone="success">✓</Badge> : <span className="text-gray-400">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader title={t('bp.users.title')} subtitle={t('bp.users.identityNote')} />

      <div className="mb-6 rounded-2lg border border-gray-200 bg-white p-6 shadow-card">
        <DescriptionList
          items={[
            { label: t('bp.users.role'), value: claims.name ?? claims.email ?? '—' },
            { label: 'Email', value: claims.email ?? '—' },
            { label: t('bp.users.tenant'), value: me.data ? shortId(me.data.tenant_id) : '—' },
            {
              label: t('bp.users.roles'),
              value: (me.data?.roles ?? claims.roles).join(', ') || t('bp.common.none'),
            },
          ]}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('bp.users.roles')}</h2>
      {roles.isError ? (
        <ErrorState error={roles.error} onRetry={() => void roles.refetch()} />
      ) : (
        <Table<RoleInfo>
          head={roleCols}
          data={roles.data ?? []}
          loading={roles.isLoading}
          rowKey={(r) => r.value}
          emptyTitle={t('panel.empty')}
        />
      )}
    </div>
  );
}
