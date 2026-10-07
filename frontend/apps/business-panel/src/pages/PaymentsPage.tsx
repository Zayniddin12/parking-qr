import { useState } from 'react';
import {
  PageHeader,
  Table,
  Select,
  DateFilterTabs,
  type DateRange,
  type TableColumn,
} from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { useQuery } from '@tanstack/react-query';
import { ErrorState, StatCard, Tabs } from '../components/common';
import { chargeStatusPill, paymentStatusPill } from '../components/status';
import { BranchSelect } from '../components/BranchSelect';
import { usePayments, useCharges } from '../lib/hooks';
import { api } from '../lib/api';
import { formatDateTime, shortId } from '../lib/format';
import { formatUZS } from '../lib/money';
import type {
  ChargeOut,
  ChargeStatus,
  PaymentMethod,
  PaymentOut,
  PaymentStatus,
  UUID,
} from '../lib/apiTypes';

type Tab = 'payments' | 'charges';
const PAGE = 25;
const METHODS: PaymentMethod[] = [
  'payme',
  'click',
  'uzum',
  'paynet',
  'multicard',
  'vtk_card',
  'cash_nv200',
  'qr',
];

/**
 * Finances: a per-branch revenue summary (settlement ledger) plus paginated,
 * filterable Payments and Charges lists. Payments/charges are read-only in the
 * Management plane (money is written by the Go orchestrator). Money in tiyin.
 */
export function PaymentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('payments');
  const [branchId, setBranchId] = useState<UUID | undefined>();
  const [range, setRange] = useState<DateRange | null>(null);

  const revenue = useQuery({
    queryKey: ['reports', 'revenue', branchId, range?.from, range?.to],
    queryFn: () => api.revenueReport(branchId!, range?.from, range?.to),
    enabled: !!branchId,
  });

  return (
    <div>
      <PageHeader
        title={t('bp.payments.title')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BranchSelect value={branchId} onChange={setBranchId} allowAll />
            <DateFilterTabs onChange={setRange} />
          </div>
        }
      />

      {branchId && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('bp.payments.gross')} value={formatUZS(revenue.data?.gross_tiyin)} tone="primary" />
          <StatCard label={t('bp.payments.net')} value={formatUZS(revenue.data?.net_tiyin)} tone="success" />
          <StatCard label={t('bp.payments.unmatched')} value={revenue.data?.unmatched_exits ?? '—'} tone="warning" />
        </div>
      )}

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'payments', label: t('bp.payments.title') },
          { key: 'charges', label: t('bp.payments.charges') },
        ]}
      />

      {tab === 'payments' ? (
        <PaymentsTab branchId={branchId} range={range} />
      ) : (
        <ChargesTab branchId={branchId} range={range} />
      )}
    </div>
  );
}

function PaymentsTab({ branchId, range }: { branchId?: UUID; range: DateRange | null }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [page, setPage] = useState(1);

  const query = usePayments({
    branch_id: branchId,
    method: method || undefined,
    status: status || undefined,
    from: range?.from,
    to: range?.to,
    limit: PAGE,
    offset: (page - 1) * PAGE,
  });

  const columns: TableColumn<PaymentOut>[] = [
    { key: 'created_at', label: t('bp.payments.createdAt'), render: (p) => formatDateTime(p.created_at) },
    { key: 'method', label: t('bp.payments.method'), render: (p) => p.method },
    { key: 'amount', label: t('bp.payments.amount'), align: 'right', render: (p) => formatUZS(p.amount_tiyin) },
    { key: 'status', label: t('bp.common.status'), render: (p) => paymentStatusPill(p.status) },
    { key: 'provider', label: t('bp.payments.provider'), render: (p) => p.provider_ref ?? '—' },
    { key: 'settled', label: t('bp.payments.settledAt'), render: (p) => formatDateTime(p.settled_at) },
  ];
  const statuses: PaymentStatus[] = ['pending', 'succeeded', 'failed', 'reversed'];

  return (
    <>
      <FilterRow>
        <Select
          label={t('bp.payments.method')}
          value={method}
          options={[{ value: '', label: t('bp.common.all') }, ...METHODS.map((m) => ({ value: m, label: m }))]}
          onChange={(e) => { setMethod(e.target.value as PaymentMethod | ''); setPage(1); }}
        />
        <Select
          label={t('bp.common.status')}
          value={status}
          options={[{ value: '', label: t('bp.common.all') }, ...statuses.map((s) => ({ value: s, label: s }))]}
          onChange={(e) => { setStatus(e.target.value as PaymentStatus | ''); setPage(1); }}
        />
      </FilterRow>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<PaymentOut>
          head={columns}
          data={query.data?.results ?? []}
          loading={query.isLoading}
          rowKey={(p) => p.id}
          total={query.data?.count ?? 0}
          currentPage={page}
          limit={PAGE}
          onPageChange={setPage}
          emptyTitle={t('panel.empty')}
        />
      )}
    </>
  );
}

function ChargesTab({ branchId, range }: { branchId?: UUID; range: DateRange | null }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [status, setStatus] = useState<ChargeStatus | ''>('');
  const [page, setPage] = useState(1);

  const query = useCharges({
    branch_id: branchId,
    method: method || undefined,
    status: status || undefined,
    from: range?.from,
    to: range?.to,
    limit: PAGE,
    offset: (page - 1) * PAGE,
  });

  const columns: TableColumn<ChargeOut>[] = [
    { key: 'created_at', label: t('bp.payments.createdAt'), render: (c) => formatDateTime(c.created_at) },
    { key: 'method', label: t('bp.payments.method'), render: (c) => c.method },
    { key: 'amount', label: t('bp.payments.amount'), align: 'right', render: (c) => formatUZS(c.amount_tiyin) },
    { key: 'status', label: t('bp.common.status'), render: (c) => chargeStatusPill(c.status) },
    { key: 'visit', label: t('bp.permits.sessions'), render: (c) => (c.visit_id ? shortId(c.visit_id) : '—') },
    { key: 'reason', label: t('bp.payments.reason'), render: (c) => c.reason_code ?? '—' },
  ];
  const statuses: ChargeStatus[] = ['pending', 'authorized', 'captured', 'failed', 'refunded', 'waived', 'canceled'];

  return (
    <>
      <FilterRow>
        <Select
          label={t('bp.payments.method')}
          value={method}
          options={[{ value: '', label: t('bp.common.all') }, ...METHODS.map((m) => ({ value: m, label: m }))]}
          onChange={(e) => { setMethod(e.target.value as PaymentMethod | ''); setPage(1); }}
        />
        <Select
          label={t('bp.common.status')}
          value={status}
          options={[{ value: '', label: t('bp.common.all') }, ...statuses.map((s) => ({ value: s, label: s }))]}
          onChange={(e) => { setStatus(e.target.value as ChargeStatus | ''); setPage(1); }}
        />
      </FilterRow>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<ChargeOut>
          head={columns}
          data={query.data?.results ?? []}
          loading={query.isLoading}
          rowKey={(c) => c.id}
          total={query.data?.count ?? 0}
          currentPage={page}
          limit={PAGE}
          onPageChange={setPage}
          emptyTitle={t('panel.empty')}
        />
      )}
    </>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-2">{children}</div>;
}
