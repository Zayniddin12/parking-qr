import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Button, Input, Select, Badge, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState, Tabs } from '../components/common';
import { FormModal } from '../components/FormModal';
import { BranchSelect } from '../components/BranchSelect';
import {
  useValidationPrograms,
  usePartnerOrgs,
  useCreateValidationProgram,
  useCreatePartnerOrg,
} from '../lib/hooks';
import { formatUZS, uzsToTiyin } from '../lib/money';
import { shortId } from '../lib/format';
import type {
  PartnerOrgOut,
  UUID,
  ValidationKind,
  ValidationProgramOut,
} from '../lib/apiTypes';

type Tab = 'programs' | 'partners';
const KINDS: ValidationKind[] = ['flat', 'percent', 'hours_free', 'free', 'price_list'];

export function ValidationPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('programs');
  return (
    <div>
      <PageHeader title={t('bp.validation.title')} />
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'programs', label: t('bp.validation.programs') },
          { key: 'partners', label: t('bp.validation.partners') },
        ]}
      />
      {tab === 'programs' ? <ProgramsTab /> : <PartnersTab />}
    </div>
  );
}

function ProgramsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState<UUID | undefined>();
  const programs = useValidationPrograms(branchId);
  const partners = usePartnerOrgs();
  const create = useCreateValidationProgram();

  const partnerName = useMemo(() => {
    const map = new Map((partners.data ?? []).map((p) => [p.id, p.name]));
    return (id: UUID) => map.get(id) ?? shortId(id);
  }, [partners.data]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    branch_id: '' as UUID | '',
    partner_org_id: '' as UUID | '',
    name: '',
    kind: 'flat' as ValidationKind,
    priority: '100',
    stackable: false,
    budgetUzs: '',
  });

  const submit = () => {
    if (!form.branch_id || !form.partner_org_id || !form.name) return;
    create.mutate(
      {
        branch_id: form.branch_id,
        partner_org_id: form.partner_org_id,
        name: form.name,
        kind: form.kind,
        priority: Number(form.priority) || 100,
        stackable: form.stackable,
        monthly_budget_tiyin: form.budgetUzs ? uzsToTiyin(form.budgetUzs) : undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const columns: TableColumn<ValidationProgramOut>[] = [
    { key: 'name', label: t('bp.validation.name'), render: (p) => p.name },
    { key: 'partner', label: t('bp.validation.partner'), render: (p) => partnerName(p.partner_org_id) },
    { key: 'kind', label: t('bp.validation.kind'), render: (p) => t(`bp.validation.kinds.${p.kind}`) },
    { key: 'priority', label: t('bp.validation.priority'), align: 'right', render: (p) => p.priority },
    {
      key: 'stackable',
      label: t('bp.validation.stackable'),
      render: (p) => (p.stackable ? <Badge tone="info">{t('bp.common.yes')}</Badge> : t('bp.common.no')),
    },
    {
      key: 'budget',
      label: t('bp.validation.budget'),
      align: 'right',
      render: (p) => (p.monthly_budget_tiyin != null ? formatUZS(p.monthly_budget_tiyin) : '—'),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <BranchSelect value={branchId} onChange={setBranchId} allowAll label={t('bp.common.branch')} />
        <Button
          variant="primary"
          onClick={() => {
            setForm((f) => ({ ...f, branch_id: branchId ?? '', partner_org_id: partners.data?.[0]?.id ?? '' }));
            setOpen(true);
          }}
        >
          {t('bp.validation.add')}
        </Button>
      </div>

      {programs.isError ? (
        <ErrorState error={programs.error} onRetry={() => void programs.refetch()} />
      ) : (
        <Table<ValidationProgramOut>
          head={columns}
          data={programs.data ?? []}
          loading={programs.isLoading}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/validation/${p.id}`)}
          emptyTitle={t('panel.empty')}
        />
      )}

      <FormModal
        show={open}
        title={t('bp.validation.add')}
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
        <Select
          label={t('bp.validation.partner')}
          value={form.partner_org_id}
          placeholder={t('bp.validation.partner')}
          options={(partners.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          onChange={(e) => setForm((f) => ({ ...f, partner_org_id: e.target.value as UUID }))}
        />
        <Input
          label={t('bp.validation.name')}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('bp.validation.kind')}
            value={form.kind}
            options={KINDS.map((k) => ({ value: k, label: t(`bp.validation.kinds.${k}`) }))}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as ValidationKind }))}
          />
          <Input
            label={t('bp.validation.priority')}
            type="number"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          />
          <Input
            label={t('bp.validation.budget') + ' (UZS)'}
            value={form.budgetUzs}
            onChange={(e) => setForm((f) => ({ ...f, budgetUzs: e.target.value }))}
          />
          <Select
            label={t('bp.validation.stackable')}
            value={form.stackable ? 'yes' : 'no'}
            options={[
              { value: 'no', label: t('bp.common.no') },
              { value: 'yes', label: t('bp.common.yes') },
            ]}
            onChange={(e) => setForm((f) => ({ ...f, stackable: e.target.value === 'yes' }))}
          />
        </div>
      </FormModal>
    </>
  );
}

function PartnersTab() {
  const { t } = useTranslation();
  const partners = usePartnerOrgs();
  const create = useCreatePartnerOrg();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    create.mutate({ name }, { onSuccess: () => { setOpen(false); setName(''); } });
  };

  const columns: TableColumn<PartnerOrgOut>[] = [
    { key: 'name', label: t('bp.validation.name'), render: (p) => p.name },
    { key: 'id', label: 'ID', render: (p) => shortId(p.id) },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setOpen(true)}>
          {t('bp.validation.addPartner')}
        </Button>
      </div>
      {partners.isError ? (
        <ErrorState error={partners.error} onRetry={() => void partners.refetch()} />
      ) : (
        <Table<PartnerOrgOut>
          head={columns}
          data={partners.data ?? []}
          loading={partners.isLoading}
          rowKey={(p) => p.id}
          emptyTitle={t('panel.empty')}
        />
      )}
      <FormModal
        show={open}
        title={t('bp.validation.addPartner')}
        submitting={create.isPending}
        error={create.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <Input label={t('bp.validation.name')} value={name} onChange={(e) => setName(e.target.value)} />
      </FormModal>
    </>
  );
}
