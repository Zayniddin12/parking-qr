import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Button, Input, Select, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState, Tabs } from '../components/common';
import { permitStatusPill, visitOutcomePill } from '../components/status';
import { FormModal } from '../components/FormModal';
import { BranchSelect } from '../components/BranchSelect';
import {
  usePermits,
  useVisits,
  useSubscriptionPlans,
  useCreatePermit,
  useCreateSubscriptionPlan,
} from '../lib/hooks';
import { formatDateTime, shortId } from '../lib/format';
import { formatUZS, uzsToTiyin } from '../lib/money';
import type {
  PermitKind,
  PermitOut,
  SubscriptionPlanOut,
  UUID,
  VisitOut,
  VisitOutcome,
} from '../lib/apiTypes';

type Tab = 'permits' | 'sessions' | 'plans';
const PAGE = 25;

export function PermitsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('permits');

  return (
    <div>
      <PageHeader title={t('bp.permits.title')} />
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'permits', label: t('bp.permits.title') },
          { key: 'sessions', label: t('bp.permits.sessions') },
          { key: 'plans', label: t('bp.permits.subscriptionPlans') },
        ]}
      />
      {tab === 'permits' && <PermitsTab />}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'plans' && <PlansTab />}
    </div>
  );
}

// --- Permits ---------------------------------------------------------------

function PermitsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState<UUID | undefined>();
  const [plate, setPlate] = useState('');
  const [kind, setKind] = useState<PermitKind | ''>('');
  const [page, setPage] = useState(1);
  const create = useCreatePermit();

  const query = usePermits({
    branch_id: branchId,
    plate: plate || undefined,
    kind: kind || undefined,
    limit: PAGE,
    offset: (page - 1) * PAGE,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ branch_id: '' as UUID | '', vehicle_id: '', kind: 'session' as PermitKind });

  const submit = () => {
    if (!form.branch_id || !form.vehicle_id) return;
    create.mutate(
      { branch_id: form.branch_id, vehicle_id: form.vehicle_id, kind: form.kind },
      { onSuccess: () => setOpen(false) },
    );
  };

  const columns: TableColumn<PermitOut>[] = [
    { key: 'vehicle', label: t('bp.permits.vehicle'), render: (p) => shortId(p.vehicle_id) },
    {
      key: 'kind',
      label: t('bp.permits.kind'),
      render: (p) => t(`bp.permits.kinds.${p.kind}`),
    },
    { key: 'valid_from', label: t('bp.permits.validFrom'), render: (p) => formatDateTime(p.valid_from) },
    { key: 'valid_to', label: t('bp.permits.validTo'), render: (p) => formatDateTime(p.valid_to) },
    { key: 'status', label: t('bp.common.status'), render: (p) => permitStatusPill(p.status) },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <BranchSelect value={branchId} onChange={setBranchId} allowAll label={t('bp.common.branch')} />
        <Input label={t('bp.permits.plate')} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
        <Select
          label={t('bp.permits.kind')}
          value={kind}
          options={[
            { value: '', label: t('bp.common.all') },
            { value: 'session', label: t('bp.permits.kinds.session') },
            { value: 'subscription', label: t('bp.permits.kinds.subscription') },
            { value: 'whitelist', label: t('bp.permits.kinds.whitelist') },
          ]}
          onChange={(e) => setKind(e.target.value as PermitKind | '')}
        />
        <Button variant="primary" onClick={() => { setForm({ branch_id: branchId ?? '', vehicle_id: '', kind: 'session' }); setOpen(true); }}>
          {t('bp.permits.add')}
        </Button>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<PermitOut>
          head={columns}
          data={query.data?.results ?? []}
          loading={query.isLoading}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/permits/${p.id}`)}
          total={query.data?.count ?? 0}
          currentPage={page}
          limit={PAGE}
          onPageChange={setPage}
          emptyTitle={t('panel.empty')}
        />
      )}

      <FormModal
        show={open}
        title={t('bp.permits.add')}
        submitting={create.isPending}
        error={create.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <BranchSelect
          label={t('bp.common.branch')}
          value={form.branch_id || undefined}
          onChange={(v) => setForm((f) => ({ ...f, branch_id: v ?? '' }))}
        />
        <Input
          label={t('bp.permits.vehicleId')}
          value={form.vehicle_id}
          onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
        />
        <Select
          label={t('bp.permits.kind')}
          value={form.kind}
          options={[
            { value: 'session', label: t('bp.permits.kinds.session') },
            { value: 'subscription', label: t('bp.permits.kinds.subscription') },
            { value: 'whitelist', label: t('bp.permits.kinds.whitelist') },
          ]}
          onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as PermitKind }))}
        />
      </FormModal>
    </>
  );
}

// --- Sessions (visits) -----------------------------------------------------

function SessionsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState<UUID | undefined>();
  const [plate, setPlate] = useState('');
  const [outcome, setOutcome] = useState<VisitOutcome | ''>('');
  const [page, setPage] = useState(1);

  const query = useVisits({
    branch_id: branchId,
    plate: plate || undefined,
    outcome: outcome || undefined,
    limit: PAGE,
    offset: (page - 1) * PAGE,
  });

  const columns: TableColumn<VisitOut>[] = [
    { key: 'vehicle', label: t('bp.permits.vehicle'), render: (v) => (v.vehicle_id ? shortId(v.vehicle_id) : '—') },
    { key: 'entry_ts', label: t('bp.permits.entry'), render: (v) => formatDateTime(v.entry_ts) },
    { key: 'exit_ts', label: t('bp.permits.exit'), render: (v) => formatDateTime(v.exit_ts) },
    { key: 'outcome', label: t('bp.permits.outcome'), render: (v) => visitOutcomePill(v.outcome) },
    {
      key: 'amount_due_tiyin',
      label: t('bp.permits.amountDue'),
      align: 'right',
      render: (v) => formatUZS(v.amount_due_tiyin),
    },
  ];

  const outcomes: VisitOutcome[] = ['open', 'paid', 'exited', 'waived', 'manual_override', 'lost_ticket', 'unmatched'];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <BranchSelect value={branchId} onChange={setBranchId} allowAll label={t('bp.common.branch')} />
        <Input label={t('bp.permits.plate')} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
        <Select
          label={t('bp.permits.outcome')}
          value={outcome}
          options={[
            { value: '', label: t('bp.common.all') },
            ...outcomes.map((o) => ({ value: o, label: o })),
          ]}
          onChange={(e) => setOutcome(e.target.value as VisitOutcome | '')}
        />
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<VisitOut>
          head={columns}
          data={query.data?.results ?? []}
          loading={query.isLoading}
          rowKey={(v) => v.id}
          onRowClick={(v) => navigate(`/permits/visits/${v.id}`)}
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

// --- Subscription plans ----------------------------------------------------

function PlansTab() {
  const { t } = useTranslation();
  const [branchId, setBranchId] = useState<UUID | undefined>();
  const query = useSubscriptionPlans(branchId);
  const create = useCreateSubscriptionPlan();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ branch_id: '' as UUID | '', code: '', name: '', priceUzs: '', period_days: '30' });

  const submit = () => {
    if (!form.branch_id || !form.code || !form.name) return;
    create.mutate(
      {
        branch_id: form.branch_id,
        code: form.code,
        name: form.name,
        price_tiyin: uzsToTiyin(form.priceUzs),
        period_days: Number(form.period_days) || 30,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const columns: TableColumn<SubscriptionPlanOut>[] = [
    { key: 'code', label: 'Code', render: (p) => p.code },
    { key: 'name', label: t('bp.branches.name'), render: (p) => p.name },
    { key: 'price', label: t('bp.payments.amount'), align: 'right', render: (p) => formatUZS(p.price_tiyin) },
    { key: 'period_days', label: 'Days', align: 'right', render: (p) => p.period_days },
    { key: 'status', label: t('bp.common.status'), render: (p) => p.status },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <BranchSelect value={branchId} onChange={setBranchId} allowAll label={t('bp.common.branch')} />
        <Button variant="primary" onClick={() => { setForm({ branch_id: branchId ?? '', code: '', name: '', priceUzs: '', period_days: '30' }); setOpen(true); }}>
          {t('common.add')}
        </Button>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<SubscriptionPlanOut>
          head={columns}
          data={query.data ?? []}
          loading={query.isLoading}
          rowKey={(p) => p.id}
          emptyTitle={t('panel.empty')}
        />
      )}

      <FormModal
        show={open}
        title={t('bp.permits.subscriptionPlans')}
        submitting={create.isPending}
        error={create.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <BranchSelect
          label={t('bp.common.branch')}
          value={form.branch_id || undefined}
          onChange={(v) => setForm((f) => ({ ...f, branch_id: v ?? '' }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          <Input label={t('bp.branches.name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label={t('bp.payments.amount') + ' (UZS)'} value={form.priceUzs} onChange={(e) => setForm((f) => ({ ...f, priceUzs: e.target.value }))} />
          <Input label="Period (days)" type="number" value={form.period_days} onChange={(e) => setForm((f) => ({ ...f, period_days: e.target.value }))} />
        </div>
      </FormModal>
    </>
  );
}
