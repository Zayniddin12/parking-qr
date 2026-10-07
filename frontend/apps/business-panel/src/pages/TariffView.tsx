import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Button, Input, Badge } from '@autoparking/ui';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { tariffStore, type TariffPlan } from '../lib/tariffStore';
import { IconTariff } from '../layout/icons';

const som = (tiyin: number) => new Intl.NumberFormat('ru-RU').format(Math.round(tiyin / 100)) + ' so‘m';

export function TariffView() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['tariffs'], queryFn: () => tariffStore.list() });
  const create = useMutation({
    mutationFn: (v: Omit<TariffPlan, 'id' | 'createdAt' | 'active'>) => tariffStore.create(v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tariffs'] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => tariffStore.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tariffs'] }),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', hourly: '5000', free: '15', cap: '50000' });
  const [toDelete, setToDelete] = useState<TariffPlan | null>(null);

  const submit = () => {
    if (!form.name.trim()) return;
    create.mutate(
      {
        name: form.name.trim(),
        hourlyTiyin: (Number(form.hourly) || 0) * 100,
        freeMinutes: Number(form.free) || 0,
        dailyCapTiyin: (Number(form.cap) || 0) * 100,
      },
      { onSuccess: () => { setOpen(false); setForm({ name: '', hourly: '5000', free: '15', cap: '50000' }); } },
    );
  };

  const plans = query.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tariflar"
        actions={
          <Button variant="primary" onClick={() => setOpen(true)} icon={<span aria-hidden="true">＋</span>}>
            Tarif qo‘shish
          </Button>
        }
      />

      {plans.length === 0 ? (
        <div className="rounded-2lg border border-dashed border-gray-300 bg-white p-12 text-center text-2xs text-gray-400">
          Tarif rejalari yo‘q
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2lg border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-2lg bg-primary-50 text-primary-600">
                  <IconTariff width={22} height={22} />
                </span>
                {p.active && <Badge tone="success">Faol</Badge>}
              </div>
              <div className="mt-4 text-base font-bold text-gray-800">{p.name}</div>
              <div className="mt-1 text-3.5xl font-bold text-primary-700">
                {som(p.hourlyTiyin)}
                <span className="ml-1 text-sm font-medium text-gray-400">/soat</span>
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-2xs">
                <Row label="Bepul vaqt" value={`${p.freeMinutes} daqiqa`} />
                <Row label="Kunlik limit" value={som(p.dailyCapTiyin)} />
              </dl>
              <button
                type="button"
                onClick={() => setToDelete(p)}
                className="mt-4 self-start text-2xs font-medium text-gray-400 transition-colors hover:text-error"
              >
                O‘chirish
              </button>
            </div>
          ))}
        </div>
      )}

      <FormModal
        show={open}
        title="Yangi tarif"
        submitting={create.isPending}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <Input label="Nomi" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Soatlik (so‘m)"
            type="number"
            value={form.hourly}
            onChange={(e) => setForm((f) => ({ ...f, hourly: e.target.value }))}
          />
          <Input
            label="Bepul (daqiqa)"
            type="number"
            value={form.free}
            onChange={(e) => setForm((f) => ({ ...f, free: e.target.value }))}
          />
          <Input
            label="Kunlik (so‘m)"
            type="number"
            value={form.cap}
            onChange={(e) => setForm((f) => ({ ...f, cap: e.target.value }))}
          />
        </div>
      </FormModal>

      <ConfirmModal
        show={!!toDelete}
        title="O‘chirish"
        message="Ushbu tarifni o‘chirasizmi?"
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-700">{value}</dd>
    </div>
  );
}
