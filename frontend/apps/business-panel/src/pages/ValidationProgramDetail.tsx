import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, Table, type TableColumn } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { CopyButton, DescriptionList, ErrorState } from '../components/common';
import { codeStatusPill } from '../components/status';
import {
  useValidationProgram,
  useValidationCodes,
  useRedemptions,
  useIssueValidationCode,
} from '../lib/hooks';
import { formatDateTime, shortId } from '../lib/format';
import { formatUZS } from '../lib/money';
import type { RedemptionOut, UUID, ValidationCodeOut } from '../lib/apiTypes';

/**
 * Validation program detail: program metadata, a "issue code" action (Ed25519 /
 * AP-QR single-use token), the issued-codes table and the redemptions ledger.
 */
export function ValidationProgramDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: UUID }>();
  const program = useValidationProgram(id);
  const codes = useValidationCodes(id);
  const redemptions = useRedemptions(id);
  const issue = useIssueValidationCode();
  const p = program.data;

  const codeCols: TableColumn<ValidationCodeOut>[] = [
    { key: 'jti', label: t('bp.validation.jti'), render: (c) => <span className="font-mono text-2xs">{shortId(c.jti)}</span> },
    { key: 'status', label: t('bp.common.status'), render: (c) => codeStatusPill(c.status) },
    { key: 'expires_at', label: t('bp.validation.expiresAt'), render: (c) => formatDateTime(c.expires_at) },
    {
      key: 'token',
      label: t('bp.validation.token'),
      render: (c) => (
        <div className="flex items-center gap-1">
          <span className="max-w-[160px] truncate font-mono text-2xs text-gray-500">{c.token}</span>
          <CopyButton text={c.token} label="" />
        </div>
      ),
    },
  ];

  const redemptionCols: TableColumn<RedemptionOut>[] = [
    { key: 'redeemed_at', label: t('bp.validation.redeemedAt'), render: (r) => formatDateTime(r.redeemed_at) },
    { key: 'amount', label: t('bp.payments.amount'), align: 'right', render: (r) => formatUZS(r.amount_tiyin) },
    { key: 'visit', label: t('bp.permits.sessions'), render: (r) => (r.visit_id ? shortId(r.visit_id) : '—') },
    { key: 'code', label: t('bp.validation.codes'), render: (r) => shortId(r.code_id) },
  ];

  return (
    <div>
      <PageHeader
        title={p?.name ?? t('bp.validation.programs')}
        subtitle={id ? shortId(id) : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              loading={issue.isPending}
              onClick={() => id && issue.mutate({ id })}
            >
              {t('bp.validation.issueCode')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/validation')}>
              {t('common.back')}
            </Button>
          </div>
        }
      />

      {program.isError ? (
        <ErrorState error={program.error} onRetry={() => void program.refetch()} />
      ) : (
        <div className="mb-6 rounded-2lg border border-gray-200 bg-white p-6 shadow-card">
          <DescriptionList
            items={[
              { label: t('bp.validation.kind'), value: p ? t(`bp.validation.kinds.${p.kind}`) : '—' },
              { label: t('bp.validation.priority'), value: p?.priority ?? '—' },
              { label: t('bp.validation.stackable'), value: p?.stackable ? t('bp.common.yes') : t('bp.common.no') },
              {
                label: t('bp.validation.budget'),
                value: p?.monthly_budget_tiyin != null ? formatUZS(p.monthly_budget_tiyin) : '—',
              },
              { label: t('bp.common.branch'), value: p ? shortId(p.branch_id) : '—' },
              { label: t('bp.validation.partner'), value: p ? shortId(p.partner_org_id) : '—' },
            ]}
          />
        </div>
      )}

      {issue.isError && <div className="mb-4"><ErrorState error={issue.error} /></div>}

      <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('bp.validation.codes')}</h2>
      {codes.isError ? (
        <ErrorState error={codes.error} onRetry={() => void codes.refetch()} />
      ) : (
        <div className="mb-6">
          <Table<ValidationCodeOut>
            head={codeCols}
            data={codes.data ?? []}
            loading={codes.isLoading}
            rowKey={(c) => c.id}
            emptyTitle={t('panel.empty')}
          />
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('bp.validation.redemptions')}</h2>
      {redemptions.isError ? (
        <ErrorState error={redemptions.error} onRetry={() => void redemptions.refetch()} />
      ) : (
        <Table<RedemptionOut>
          head={redemptionCols}
          data={redemptions.data ?? []}
          loading={redemptions.isLoading}
          rowKey={(r) => r.id}
          emptyTitle={t('panel.empty')}
        />
      )}
    </div>
  );
}
