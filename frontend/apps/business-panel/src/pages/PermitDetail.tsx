import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, Table, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { DescriptionList, ErrorState } from '../components/common';
import { paymentStatusPill, permitStatusPill } from '../components/status';
import { usePermit, usePermitPayments } from '../lib/hooks';
import { formatDateTime, shortId } from '../lib/format';
import { formatUZS } from '../lib/money';
import type { PaymentOut, UUID } from '../lib/apiTypes';

/** Permit detail + its payments (`GET /permits/{id}` + `/payments`). */
export function PermitDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: UUID }>();
  const permit = usePermit(id);
  const payments = usePermitPayments(id);
  const p = permit.data;

  const cols: TableColumn<PaymentOut>[] = [
    { key: 'created_at', label: t('bp.payments.createdAt'), render: (x) => formatDateTime(x.created_at) },
    { key: 'method', label: t('bp.payments.method'), render: (x) => x.method },
    { key: 'amount', label: t('bp.payments.amount'), align: 'right', render: (x) => formatUZS(x.amount_tiyin) },
    { key: 'status', label: t('bp.common.status'), render: (x) => paymentStatusPill(x.status) },
  ];

  return (
    <div>
      <PageHeader
        title={t('bp.permits.title')}
        subtitle={id ? shortId(id) : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/permits')}>
            {t('common.back')}
          </Button>
        }
      />

      {permit.isError ? (
        <ErrorState error={permit.error} onRetry={() => void permit.refetch()} />
      ) : (
        <div className="mb-6 rounded-2lg border border-gray-200 bg-white p-6 shadow-card">
          <DescriptionList
            items={[
              { label: t('bp.permits.kind'), value: p ? t(`bp.permits.kinds.${p.kind}`) : '—' },
              { label: t('bp.common.status'), value: permitStatusPill(p?.status) },
              { label: t('bp.permits.vehicle'), value: p ? shortId(p.vehicle_id) : '—' },
              { label: t('bp.common.branch'), value: p ? shortId(p.branch_id) : '—' },
              { label: t('bp.permits.validFrom'), value: formatDateTime(p?.valid_from) },
              { label: t('bp.permits.validTo'), value: formatDateTime(p?.valid_to) },
            ]}
          />
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('bp.permits.payments')}</h2>
      {payments.isError ? (
        <ErrorState error={payments.error} onRetry={() => void payments.refetch()} />
      ) : (
        <Table<PaymentOut>
          head={cols}
          data={payments.data ?? []}
          loading={payments.isLoading}
          rowKey={(x) => x.id}
          emptyTitle={t('panel.empty')}
        />
      )}
    </div>
  );
}
