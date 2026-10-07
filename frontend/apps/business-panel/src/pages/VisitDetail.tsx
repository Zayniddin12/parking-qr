import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, Table, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { DescriptionList, ErrorState } from '../components/common';
import { paymentStatusPill, visitOutcomePill } from '../components/status';
import { useVisit, useVisitPayments } from '../lib/hooks';
import { formatDateTime, shortId } from '../lib/format';
import { formatUZS } from '../lib/money';
import type { PaymentOut, UUID } from '../lib/apiTypes';

/** Session (visit) detail + its payments (`GET /visits/{id}` + `/payments`). */
export function VisitDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: UUID }>();
  const visit = useVisit(id);
  const payments = useVisitPayments(id);
  const v = visit.data;

  const cols: TableColumn<PaymentOut>[] = [
    { key: 'created_at', label: t('bp.payments.createdAt'), render: (x) => formatDateTime(x.created_at) },
    { key: 'method', label: t('bp.payments.method'), render: (x) => x.method },
    { key: 'amount', label: t('bp.payments.amount'), align: 'right', render: (x) => formatUZS(x.amount_tiyin) },
    { key: 'status', label: t('bp.common.status'), render: (x) => paymentStatusPill(x.status) },
  ];

  return (
    <div>
      <PageHeader
        title={t('bp.permits.sessions')}
        subtitle={id ? shortId(id) : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/permits')}>
            {t('common.back')}
          </Button>
        }
      />

      {visit.isError ? (
        <ErrorState error={visit.error} onRetry={() => void visit.refetch()} />
      ) : (
        <div className="mb-6 rounded-2lg border border-gray-200 bg-white p-6 shadow-card">
          <DescriptionList
            items={[
              { label: t('bp.permits.outcome'), value: visitOutcomePill(v?.outcome) },
              { label: t('bp.permits.amountDue'), value: formatUZS(v?.amount_due_tiyin) },
              { label: t('bp.permits.vehicle'), value: v?.vehicle_id ? shortId(v.vehicle_id) : '—' },
              { label: t('bp.common.branch'), value: v ? shortId(v.branch_id) : '—' },
              { label: t('bp.permits.entry'), value: formatDateTime(v?.entry_ts) },
              { label: t('bp.permits.exit'), value: formatDateTime(v?.exit_ts) },
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
