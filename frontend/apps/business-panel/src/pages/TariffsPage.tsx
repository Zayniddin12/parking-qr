import { useMemo, useState } from 'react';
import { PageHeader, Table, Button, Input, Select, Badge, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState } from '../components/common';
import { FormModal } from '../components/FormModal';
import { BranchSelect } from '../components/BranchSelect';
import { useBranches, useRatePlans, usePublishRatePlan } from '../lib/hooks';
import { formatDateTime, shortId } from '../lib/format';
import type { RatePlanOut, UUID } from '../lib/apiTypes';

const SAMPLE_DOC = JSON.stringify(
  { grace_minutes: 15, tiers: [{ up_to_minutes: 60, price_tiyin: 500000 }], cap_tiyin: 5000000 },
  null,
  2,
);

const STATUS_TONE = { published: 'success', draft: 'warning', superseded: 'neutral' } as const;

/**
 * Tariffs: versioned RatePlan authoring. Publishing creates a NEW immutable
 * version (server assigns version + Ed25519 signature); the table shows the full
 * version history newest-first. Filterable by branch.
 */
export function TariffsPage() {
  const { t } = useTranslation();
  const { data: branches } = useBranches();
  const [branchId, setBranchId] = useState<UUID | undefined>(undefined);
  const { data, isLoading, isError, error, refetch } = useRatePlans(branchId);
  const publish = usePublishRatePlan();

  const [open, setOpen] = useState(false);
  const [formBranch, setFormBranch] = useState<UUID | undefined>(undefined);
  const [currency, setCurrency] = useState('UZS');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [doc, setDoc] = useState(SAMPLE_DOC);
  const [publishNow, setPublishNow] = useState(true);
  const [docError, setDocError] = useState<string>();

  const branchName = useMemo(() => {
    const map = new Map((branches ?? []).map((b) => [b.id, b.name]));
    return (id: UUID) => map.get(id) ?? shortId(id);
  }, [branches]);

  const openForm = () => {
    setFormBranch(branchId ?? branches?.[0]?.id);
    setCurrency('UZS');
    setEffectiveFrom(new Date().toISOString().slice(0, 16));
    setDoc(SAMPLE_DOC);
    setPublishNow(true);
    setDocError(undefined);
    setOpen(true);
  };

  const submit = () => {
    if (!formBranch) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(doc) as Record<string, unknown>;
    } catch {
      setDocError(t('bp.tariffs.invalidJson'));
      return;
    }
    publish.mutate(
      {
        branch_id: formBranch,
        currency,
        doc: parsed,
        effective_from: new Date(effectiveFrom).toISOString(),
        publish: publishNow,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const columns: TableColumn<RatePlanOut>[] = [
    { key: 'branch', label: t('bp.common.branch'), render: (p) => branchName(p.branch_id) },
    { key: 'version', label: t('bp.tariffs.version'), align: 'right', render: (p) => `v${p.version}` },
    { key: 'currency', label: t('bp.tariffs.currency'), render: (p) => p.currency },
    {
      key: 'status',
      label: t('bp.common.status'),
      render: (p) => <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>,
    },
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

  return (
    <div>
      <PageHeader
        title={t('bp.tariffs.title')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BranchSelect value={branchId} onChange={setBranchId} allowAll />
            <Button variant="primary" onClick={openForm} icon={<span aria-hidden="true">＋</span>}>
              {t('bp.tariffs.newVersion')}
            </Button>
          </div>
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Table<RatePlanOut>
          head={columns}
          data={data ?? []}
          loading={isLoading}
          rowKey={(p) => p.id}
          emptyTitle={t('panel.empty')}
        />
      )}

      <FormModal
        show={open}
        title={t('bp.tariffs.newVersion')}
        size="lg"
        submitLabel={publishNow ? t('bp.tariffs.publish') : t('bp.tariffs.saveDraft')}
        submitting={publish.isPending}
        error={publish.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <BranchSelect
          label={t('bp.common.branch')}
          value={formBranch}
          onChange={(v) => setFormBranch(v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('bp.tariffs.currency')}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
          <Input
            label={t('bp.tariffs.effectiveFrom')}
            type="datetime-local"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-medium text-gray-600">{t('bp.tariffs.doc')}</label>
          <textarea
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-2lg border border-gray-200 bg-white px-3 py-2 font-mono text-2xs text-gray-700 shadow-search focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {docError ? (
            <span className="text-2xs text-error">{docError}</span>
          ) : (
            <span className="text-2xs text-gray-500">{t('bp.tariffs.docHint')}</span>
          )}
        </div>
        <Select
          label={t('bp.common.status')}
          value={publishNow ? 'publish' : 'draft'}
          options={[
            { value: 'publish', label: t('bp.tariffs.publish') },
            { value: 'draft', label: t('bp.tariffs.saveDraft') },
          ]}
          onChange={(e) => setPublishNow(e.target.value === 'publish')}
        />
      </FormModal>
    </div>
  );
}
