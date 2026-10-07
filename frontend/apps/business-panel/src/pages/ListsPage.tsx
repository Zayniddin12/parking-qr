import { useState } from 'react';
import { PageHeader, Table, Button, Input, Select, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState, Plate } from '../components/common';
import { listKindPill } from '../components/status';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { BranchSelect } from '../components/BranchSelect';
import {
  useListEntries,
  useCreateListEntry,
  useUpdateListEntry,
  useDeleteListEntry,
} from '../lib/hooks';
import { formatDate } from '../lib/format';
import type { ListEntryOut, ListKind, ListScope, UUID } from '../lib/apiTypes';

const KINDS: ListKind[] = ['whitelist', 'blacklist', 'watchlist'];
const SCOPES: ListScope[] = ['branch', 'organization', 'global'];

/** White/black/watch lists CRUD. Plate/kind/scope are immutable once created
 *  (delete + re-create); reason is editable and bumps the audited version. */
export function ListsPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ListKind | ''>('');
  const [branchId, setBranchId] = useState<UUID | undefined>();
  const query = useListEntries(kind || undefined, branchId);
  const create = useCreateListEntry();
  const update = useUpdateListEntry();
  const del = useDeleteListEntry();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ListEntryOut | null>(null);
  const [form, setForm] = useState({
    kind: 'blacklist' as ListKind,
    scope: 'branch' as ListScope,
    scope_id: '' as UUID | '',
    plate: '',
    country: 'uz',
    reason: '',
  });
  const [toDelete, setToDelete] = useState<ListEntryOut | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ kind: kind || 'blacklist', scope: 'branch', scope_id: branchId ?? '', plate: '', country: 'uz', reason: '' });
    setOpen(true);
  };
  const openEdit = (e: ListEntryOut) => {
    setEditing(e);
    setForm({ kind: e.kind, scope: e.scope, scope_id: (e.scope_id ?? '') as UUID | '', plate: e.plate, country: e.country, reason: e.reason ?? '' });
    setOpen(true);
  };

  const submit = () => {
    if (editing) {
      update.mutate({ id: editing.id, body: { reason: form.reason || undefined } }, { onSuccess: () => setOpen(false) });
    } else {
      if (!form.plate.trim()) return;
      create.mutate(
        {
          kind: form.kind,
          scope: form.scope,
          scope_id: form.scope === 'branch' && form.scope_id ? form.scope_id : undefined,
          plate: form.plate,
          country: form.country || 'uz',
          reason: form.reason || undefined,
        },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const columns: TableColumn<ListEntryOut>[] = [
    { key: 'plate', label: t('bp.lists.plate'), render: (e) => <Plate value={e.plate} /> },
    { key: 'kind', label: t('bp.lists.kind'), render: (e) => listKindPill(e.kind, t(`bp.lists.kinds.${e.kind}`)) },
    { key: 'scope', label: t('bp.lists.scope'), render: (e) => t(`bp.lists.scopes.${e.scope}`) },
    { key: 'reason', label: t('bp.lists.reason'), render: (e) => e.reason ?? '—' },
    { key: 'version', label: t('bp.lists.version'), align: 'right', render: (e) => e.version },
    { key: 'valid_from', label: t('bp.permits.validFrom'), render: (e) => formatDate(e.valid_from) },
    {
      key: 'actions',
      label: t('bp.common.actions'),
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>
            {t('common.edit')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(e)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('bp.lists.title')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={kind}
              options={[{ value: '', label: t('bp.common.all') }, ...KINDS.map((k) => ({ value: k, label: t(`bp.lists.kinds.${k}`) }))]}
              onChange={(e) => setKind(e.target.value as ListKind | '')}
            />
            <BranchSelect value={branchId} onChange={setBranchId} allowAll />
            <Button variant="primary" onClick={openCreate} icon={<span aria-hidden="true">＋</span>}>
              {t('bp.lists.add')}
            </Button>
          </div>
        }
      />

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<ListEntryOut>
          head={columns}
          data={query.data ?? []}
          loading={query.isLoading}
          rowKey={(e) => e.id}
          emptyTitle={t('panel.empty')}
        />
      )}

      <FormModal
        show={open}
        title={editing ? t('bp.lists.edit') : t('bp.lists.add')}
        submitting={create.isPending || update.isPending}
        error={create.error ?? update.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('bp.lists.kind')}
            value={form.kind}
            disabled={!!editing}
            options={KINDS.map((k) => ({ value: k, label: t(`bp.lists.kinds.${k}`) }))}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as ListKind }))}
          />
          <Select
            label={t('bp.lists.scope')}
            value={form.scope}
            disabled={!!editing}
            options={SCOPES.map((s) => ({ value: s, label: t(`bp.lists.scopes.${s}`) }))}
            onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as ListScope }))}
          />
        </div>
        {form.scope === 'branch' && !editing && (
          <BranchSelect
            label={t('bp.common.branch')}
            value={form.scope_id || undefined}
            onChange={(v) => setForm((f) => ({ ...f, scope_id: v ?? '' }))}
          />
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('bp.lists.plate')}
            value={form.plate}
            disabled={!!editing}
            onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
          />
          <Input
            label={t('bp.lists.country')}
            value={form.country}
            disabled={!!editing}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          />
        </div>
        <Input
          label={t('bp.lists.reason')}
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        />
      </FormModal>

      <ConfirmModal
        show={!!toDelete}
        title={t('common.delete')}
        message={t('bp.lists.deleteConfirm')}
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
