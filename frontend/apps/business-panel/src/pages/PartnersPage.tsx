import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Button, Input, Badge, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { ErrorState } from '../components/common';
import { FormModal } from '../components/FormModal';
import { formatDate } from '../lib/format';
import { usePartners, useCreatePartner } from '../lib/partnerHooks';
import type { Partner } from '../lib/partnersStore';
import { PartnerLogo } from '../components/PartnerLogo';

const EMPTY = { name: '', key: '', email: '', password: '', freeMinutes: '120', logoUrl: '' };

/** Partners directory. A partner is a validating tenant (mall, cafe, clinic…)
 *  that logs into the partner landing and issues QR checks for its visitors'
 *  cars. Create with name + logo + email + password; the list is the entry
 *  point into each partner's reports & tariff. */
export function PartnersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = usePartners();
  const create = useCreatePartner();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const openCreate = () => {
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const pickLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.name.trim() || !form.key.trim() || !form.email.trim() || form.password.length < 6)
      return;
    create.mutate(
      {
        name: form.name,
        key: form.key,
        email: form.email,
        password: form.password,
        logoUrl: form.logoUrl || undefined,
        tariff: { freeMinutes: Number(form.freeMinutes) || 0 },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const columns: TableColumn<Partner>[] = [
    {
      key: 'name',
      label: t('bp.partners.name'),
      render: (p) => (
        <div className="flex items-center gap-3">
          <PartnerLogo name={p.name} src={p.logoUrl} size={36} />
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">{p.name}</span>
            <span className="text-2xs text-gray-500">{p.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'key',
      label: t('bp.partners.key'),
      render: (p) => (
        <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wider text-primary-700">
          {p.key}
        </span>
      ),
    },
    {
      key: 'tariff',
      label: t('bp.partners.freeMinutes'),
      render: (p) => `${p.tariff.freeMinutes} ${t('bp.partners.min')}`,
    },
    {
      key: 'status',
      label: t('bp.common.status'),
      render: (p) =>
        p.active ? (
          <Badge tone="success">{t('bp.partners.active')}</Badge>
        ) : (
          <Badge tone="neutral">{t('bp.partners.inactive')}</Badge>
        ),
    },
    { key: 'createdAt', label: t('bp.partners.created'), render: (p) => formatDate(p.createdAt) },
    {
      key: 'actions',
      label: t('bp.common.actions'),
      align: 'right',
      render: (p) => (
        <Button size="sm" variant="ghost" onClick={() => navigate(`/partners/${p.id}`)}>
          {t('bp.common.view')} →
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('bp.partners.title')}
        subtitle={t('bp.partners.subtitle')}
        actions={
          <Button variant="primary" onClick={openCreate} icon={<span aria-hidden="true">＋</span>}>
            {t('bp.partners.add')}
          </Button>
        }
      />

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <Table<Partner>
          head={columns}
          data={query.data ?? []}
          loading={query.isLoading}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/partners/${p.id}`)}
          emptyTitle={t('bp.partners.empty')}
        />
      )}

      <FormModal
        show={open}
        title={t('bp.partners.add')}
        submitting={create.isPending}
        error={create.error}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      >
        <div className="flex items-center gap-4">
          <PartnerLogo name={form.name || '?'} src={form.logoUrl || undefined} size={56} />
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
            {form.logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, logoUrl: '' }))}
              >
                {t('common.delete')}
              </Button>
            )}
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('bp.partners.email')}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t('bp.partners.password')}
            type="password"
            value={form.password}
            hint={t('bp.partners.passwordHint')}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>
        <Input
          label={t('bp.partners.freeMinutes')}
          type="number"
          value={form.freeMinutes}
          onChange={(e) => setForm((f) => ({ ...f, freeMinutes: e.target.value }))}
        />
      </FormModal>
    </div>
  );
}
