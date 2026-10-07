import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Table, Button, Input, type TableColumn } from '@autoparking/ui';
import { Plate } from '../components/common';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDateTime } from '../lib/format';
import { listsStore, type ListEntry, type ListKind } from '../lib/listsStore';

const COPY: Record<ListKind, { title: string; add: string; empty: string; accent: string }> = {
  whitelist: {
    title: 'Oq ro‘yxat',
    add: 'Avtoraqam qo‘shish',
    empty: 'Oq ro‘yxat bo‘sh',
    accent: 'text-green-600',
  },
  blacklist: {
    title: 'Qora ro‘yxat',
    add: 'Avtoraqam qo‘shish',
    empty: 'Qora ro‘yxat bo‘sh',
    accent: 'text-error',
  },
};

export function ListView({ kind }: { kind: ListKind }) {
  const copy = COPY[kind];
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['demo-lists', kind], queryFn: () => listsStore.list(kind) });

  const create = useMutation({
    mutationFn: (v: { plate: string; country: string; reason?: string }) =>
      listsStore.create(kind, v.plate, v.country, v.reason),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['demo-lists', kind] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => listsStore.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['demo-lists', kind] }),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ plate: '', country: 'uz', reason: '' });
  const [toDelete, setToDelete] = useState<ListEntry | null>(null);

  const submit = () => {
    if (!form.plate.trim()) return;
    create.mutate(
      { plate: form.plate, country: form.country, reason: form.reason },
      { onSuccess: () => { setOpen(false); setForm({ plate: '', country: 'uz', reason: '' }); } },
    );
  };

  const columns: TableColumn<ListEntry>[] = [
    { key: 'plate', label: 'Avtoraqam', render: (e) => <Plate value={e.plate} /> },
    { key: 'country', label: 'Davlat', render: (e) => e.country.toUpperCase() },
    { key: 'reason', label: 'Sabab', render: (e) => e.reason ?? '—' },
    { key: 'createdAt', label: 'Qo‘shilgan', render: (e) => formatDateTime(e.createdAt) },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (e) => (
        <Button size="sm" variant="ghost" onClick={() => setToDelete(e)}>
          O‘chirish
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={copy.title}
        actions={
          <Button variant="primary" onClick={() => setOpen(true)} icon={<span aria-hidden="true">＋</span>}>
            {copy.add}
          </Button>
        }
      />

      <Table<ListEntry>
        head={columns}
        data={query.data ?? []}
        loading={query.isLoading}
        rowKey={(e) => e.id}
        emptyTitle={copy.empty}
      />

      <FormModal
        show={open}
        title={copy.add}
        submitting={create.isPending}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Avtoraqam"
            value={form.plate}
            onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
          />
          <Input
            label="Davlat"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          />
        </div>
        <Input
          label="Sabab"
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        />
      </FormModal>

      <ConfirmModal
        show={!!toDelete}
        title="O‘chirish"
        message="Ushbu yozuvni o‘chirishni tasdiqlaysizmi?"
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}
