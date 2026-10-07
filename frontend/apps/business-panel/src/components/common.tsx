/**
 * App-local presentational helpers composed from the read-only `@autoparking/ui`
 * primitives + design tokens. Shared across every Business Panel screen.
 */
import type { ReactNode } from 'react';
import { Badge, Button, type BadgeTone } from '@autoparking/ui';
import { useTranslation } from '@autoparking/i18n';
import { errorMessage } from '../lib/format';

/** Inline error box with a retry button (matches the existing BranchesPage). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="font-medium">{t('bp.common.loadFailed')}</div>
      <div className="mt-1 text-red-600">{errorMessage(error)}</div>
      {onRetry && (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

/** KPI stat tile used on the dashboard + detail overviews. */
export function StatCard({
  label,
  value,
  sub,
  tone = 'primary',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: BadgeTone;
}) {
  return (
    <div className="rounded-2lg border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-medium text-gray-500">{label}</span>
        <Badge tone={tone}>•</Badge>
      </div>
      <div className="mt-3 text-3.5xl font-bold text-gray-700">{value}</div>
      {sub && <div className="mt-1 text-2xs text-gray-500">{sub}</div>}
    </div>
  );
}

/** Definition list for detail panes: label/value rows. */
export function DescriptionList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <dt className="text-2xs font-medium uppercase tracking-wide text-gray-500">{it.label}</dt>
          <dd className="text-sm text-gray-700">{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Simple tab bar (route-free, local state driven by the parent). */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={
            'relative -mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ' +
            (active === tab.key
              ? 'border-primary text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700')
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** A monospaced plate chip. */
export function Plate({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wider text-gray-700">
      {value}
    </span>
  );
}

/** Copy-to-clipboard button for tokens / ids. */
export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => void navigator.clipboard?.writeText(text)}
      icon={<span aria-hidden="true">⧉</span>}
    >
      {label ?? t('bp.common.copy')}
    </Button>
  );
}

// Status → pill mappers live in ./status (separate module keeps Fast Refresh
// happy: components here, helper functions there). Re-imported by the pages.
