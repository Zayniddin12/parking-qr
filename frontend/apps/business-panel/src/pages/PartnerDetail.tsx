import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Table, Button, Input, Badge, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState, StatCard, Tabs, Plate } from '../components/common';
import { FormModal } from '../components/FormModal';
import { PartnerLogo } from '../components/PartnerLogo';
import { formatDateTime, formatDate } from '../lib/format';
import { usePartner, usePartnerChecks, useUpdatePartner } from '../lib/partnerHooks';
import type { IssuedCheck } from '../lib/partnersStore';

type Tab = 'reports' | 'tariff';

const DAY = 86_400_000;

export function PartnerDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const partner = usePartner(id);
  const checks = usePartnerChecks(id);
  const update = useUpdatePartner();

  const [tab, setTab] = useState<Tab>('reports');
  const [editOpen, setEditOpen] = useState(false);
  const [tariffOpen, setTariffOpen] = useState(false);

  if (partner.isError) {
    return <ErrorState error={partner.error} onRetry={() => void partner.refetch()} />;
  }
  const p = partner.data;

  const rows = checks.data ?? [];
  const now = Date.now();
  const inWindow = rows.filter((c) => now - new Date(c.createdAt).getTime() <= 2 * DAY);
  const today = rows.filter((c) => now - new Date(c.createdAt).getTime() <= DAY);
  const uniquePlates = new Set(rows.map((c) => c.plate)).size;

  const columns: TableColumn<IssuedCheck>[] = [
    { key: 'id', label: t('bp.partners.checkId'), render: (c) => <span className="font-mono text-2xs font-semibold text-gray-700">{c.id}</span> },
    { key: 'plate', label: t('bp.partners.plate'), render: (c) => <Plate value={c.plate} /> },
    { key: 'createdAt', label: t('bp.partners.issuedAt'), render: (c) => formatDateTime(c.createdAt) },
  ];

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/partners')}>
        ← {t('bp.partners.title')}
      </Button>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-4">
          <PartnerLogo name={p?.name ?? '…'} src={p?.logoUrl} size={64} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-700">{p?.name ?? '…'}</h1>
              {p &&
                (p.active ? (
                  <Badge tone="success">{t('bp.partners.active')}</Badge>
                ) : (
                  <Badge tone="neutral">{t('bp.partners.inactive')}</Badge>
                ))}
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xs text-gray-500">
              {p && (
                <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 font-mono font-semibold uppercase tracking-wider text-primary-700">
                  {p.key}
                </span>
              )}
              <span>{p?.email}</span>
            </div>
            <div className="mt-0.5 text-2xs text-gray-500">
              {t('bp.partners.created')}: {formatDate(p?.createdAt)}
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditOpen(true)} disabled={!p}>
          {t('bp.partners.editCredentials')}
        </Button>
      </div>

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'reports', label: t('bp.partners.tabReports') },
          { key: 'tariff', label: t('bp.partners.tabTariff') },
        ]}
      />

      {tab === 'reports' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label={t('bp.partners.totalChecks')} value={rows.length} tone="primary" />
            <StatCard label={t('bp.partners.last2days')} value={inWindow.length} tone="info" />
            <StatCard label={t('bp.partners.todayChecks')} value={today.length} tone="success" />
            <StatCard label={t('bp.partners.uniquePlates')} value={uniquePlates} tone="warning" />
          </div>
          <Table<IssuedCheck>
            head={columns}
            data={rows}
            loading={checks.isLoading}
            rowKey={(c) => c.id}
            emptyTitle={t('bp.partners.noChecks')}
          />
        </div>
      )}

      {tab === 'tariff' && p && (
        <div className="max-w-xl rounded-2lg border border-gray-200 bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xs font-medium uppercase tracking-wide text-gray-500">
                {t('bp.partners.freeMinutes')}
              </div>
              <div className="mt-1 text-4.5xl font-bold text-primary-700">
                {p.tariff.freeMinutes}
                <span className="ml-2 text-base font-medium text-gray-500">{t('bp.partners.min')}</span>
              </div>
              {p.tariff.note && <div className="mt-3 text-sm text-gray-600">{p.tariff.note}</div>}
            </div>
            <Button variant="secondary" onClick={() => setTariffOpen(true)}>
              {t('common.edit')}
            </Button>
          </div>
          <p className="mt-6 border-t border-gray-100 pt-4 text-2xs text-gray-500">
            {t('bp.partners.tariffHelp')}
          </p>
        </div>
      )}

      {p && (
        <EditCredentialsModal
          show={editOpen}
          partnerName={p.name}
          initial={{ name: p.name, key: p.key, email: p.email, logoUrl: p.logoUrl ?? '', active: p.active }}
          submitting={update.isPending}
          error={update.error}
          onClose={() => setEditOpen(false)}
          onSubmit={(body) => update.mutate({ id: p.id, body }, { onSuccess: () => setEditOpen(false) })}
        />
      )}

      {p && (
        <TariffModal
          show={tariffOpen}
          initial={{ freeMinutes: String(p.tariff.freeMinutes), note: p.tariff.note ?? '' }}
          submitting={update.isPending}
          error={update.error}
          onClose={() => setTariffOpen(false)}
          onSubmit={(freeMinutes, note) =>
            update.mutate(
              { id: p.id, body: { tariff: { freeMinutes, note } } },
              { onSuccess: () => setTariffOpen(false) },
            )
          }
        />
      )}
    </div>
  );
}

// --- credentials modal -----------------------------------------------------
function EditCredentialsModal({
  show,
  partnerName,
  initial,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  show: boolean;
  partnerName: string;
  initial: { name: string; key: string; email: string; logoUrl: string; active: boolean };
  submitting: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (body: {
    name: string;
    key: string;
    email: string;
    password?: string;
    logoUrl?: string;
    active: boolean;
  }) => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ ...initial, password: '' });

  // Re-seed when re-opened for a different partner.
  const key = `${initial.name}|${initial.email}`;
  const [seededKey, setSeededKey] = useState(key);
  if (show && seededKey !== key) {
    setForm({ ...initial, password: '' });
    setSeededKey(key);
  }

  const pickLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <FormModal
      show={show}
      title={t('bp.partners.editCredentials')}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={() =>
        onSubmit({
          name: form.name,
          key: form.key,
          email: form.email,
          password: form.password || undefined,
          logoUrl: form.logoUrl,
          active: form.active,
        })
      }
    >
      <div className="flex items-center gap-4">
        <PartnerLogo name={form.name || partnerName} src={form.logoUrl || undefined} size={56} />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickLogo(e.target.files?.[0])}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            {t('bp.partners.uploadLogo')}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('bp.partners.name')}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label={t('bp.partners.key')}
          value={form.key}
          hint={t('bp.partners.keyHint')}
          onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase() }))}
        />
      </div>
      <Input
        label={t('bp.partners.email')}
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <Input
        label={t('bp.partners.newPassword')}
        type="password"
        value={form.password}
        hint={t('bp.partners.newPasswordHint')}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
        />
        {t('bp.partners.activeAccount')}
      </label>
    </FormModal>
  );
}

// --- tariff modal ----------------------------------------------------------
function TariffModal({
  show,
  initial,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  show: boolean;
  initial: { freeMinutes: string; note: string };
  submitting: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (freeMinutes: number, note: string) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);
  const [seeded, setSeeded] = useState(initial.freeMinutes + initial.note);
  const key = initial.freeMinutes + initial.note;
  if (show && seeded !== key) {
    setForm(initial);
    setSeeded(key);
  }

  return (
    <FormModal
      show={show}
      title={t('bp.partners.tabTariff')}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={() => onSubmit(Number(form.freeMinutes) || 0, form.note)}
    >
      <Input
        label={t('bp.partners.freeMinutes')}
        type="number"
        value={form.freeMinutes}
        onChange={(e) => setForm((f) => ({ ...f, freeMinutes: e.target.value }))}
      />
      <Input
        label={t('bp.partners.tariffNote')}
        value={form.note}
        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
      />
    </FormModal>
  );
}
