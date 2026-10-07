import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Button, Input, Select, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState } from '../components/common';
import { branchStatusPill } from '../components/status';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useArchiveBranch,
} from '../lib/hooks';
import { shortId } from '../lib/format';
import type { BranchOut, BranchStatus } from '../lib/apiTypes';

interface FormState {
  name: string;
  address: string;
  timezone: string;
  status: BranchStatus;
}

const EMPTY: FormState = { name: '', address: '', timezone: 'Asia/Tashkent', status: 'active' };

/**
 * Branches: the operator's own filials (`GET /branches`, RLS-scoped). Create +
 * edit via a form modal, soft-archive via a confirm dialog, row click → detail.
 */
export function BranchesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useBranches();
  const create = useCreateBranch();
  const update = useUpdateBranch();
  const archive = useArchiveBranch();

  const [editing, setEditing] = useState<BranchOut | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [nameError, setNameError] = useState<string>();
  const [toArchive, setToArchive] = useState<BranchOut | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setNameError(undefined);
    setOpen(true);
  };
  const openEdit = (b: BranchOut) => {
    setEditing(b);
    setForm({ name: b.name, address: b.address ?? '', timezone: b.timezone, status: b.status });
    setNameError(undefined);
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) {
      setNameError(t('bp.common.required'));
      return;
    }
    if (editing) {
      update.mutate(
        {
          id: editing.id,
          body: {
            name: form.name,
            address: form.address || undefined,
            timezone: form.timezone,
            status: form.status,
          },
        },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      create.mutate(
        { name: form.name, address: form.address || undefined, timezone: form.timezone },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const columns: TableColumn<BranchOut>[] = [
    { key: 'name', label: t('bp.branches.name'), render: (b) => b.name },
    { key: 'address', label: t('bp.branches.address'), render: (b) => b.address ?? '—' },
    {
      key: 'ratePlan',
      label: t('bp.branches.ratePlan'),
      render: (b) => (b.active_rate_plan_id ? shortId(b.active_rate_plan_id) : '—'),
    },
    { key: 'billing', label: t('bp.branches.billing'), render: (b) => b.billing_status },
    { key: 'status', label: t('bp.common.status'), render: (b) => branchStatusPill(b.status) },
    {
      key: 'actions',
      label: t('bp.common.actions'),
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/branches/${b.id}`)}>
            {t('bp.common.view')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
            {t('common.edit')}
          </Button>
          {b.status !== 'archived' && (
            <Button size="sm" variant="ghost" onClick={() => setToArchive(b)}>
              {t('bp.branches.archive')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('bp.branches.title')}
        subtitle="My branches"
        actions={
          <Button variant="primary" onClick={openCreate} icon={<span aria-hidden="true">＋</span>}>
            {t('bp.branches.add')}
          </Button>
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Table<BranchOut>
          head={columns}
          data={data ?? []}
          loading={isLoading}
          rowKey={(b) => b.id}
          onRowClick={(b) => navigate(`/branches/${b.id}`)}
          emptyTitle={t('panel.empty')}
        />
      )}

      <FormModal
        show={open}
        title={editing ? t('bp.branches.edit') : t('bp.branches.add')}
        submitting={create.isPending || update.isPending}
        error={create.error ?? update.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <Input
          label={t('bp.branches.name')}
          value={form.name}
          error={nameError}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label={t('bp.branches.address')}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
        <Input
          label={t('bp.branches.timezone')}
          value={form.timezone}
          onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
        />
        {editing && (
          <Select
            label={t('bp.common.status')}
            value={form.status}
            options={[
              { value: 'active', label: t('status.online') },
              { value: 'suspended', label: t('status.watchlist') },
              { value: 'archived', label: t('status.offline') },
            ]}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BranchStatus }))}
          />
        )}
      </FormModal>

      <ConfirmModal
        show={!!toArchive}
        title={t('bp.branches.archive')}
        message={t('bp.branches.archiveConfirm')}
        confirmLabel={t('bp.branches.archive')}
        loading={archive.isPending}
        onClose={() => setToArchive(null)}
        onConfirm={() =>
          toArchive &&
          archive.mutate(toArchive.id, { onSuccess: () => setToArchive(null) })
        }
      />
    </div>
  );
}
