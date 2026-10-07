import { useMemo, useState } from 'react';
import { cn } from '../lib/cn';

export type DatePreset = 'today' | 'yesterday' | 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  from: string; // ISO date (YYYY-MM-DD)
  to: string;
  preset: DatePreset;
}

export interface DateFilterTabsProps {
  value?: DatePreset;
  onChange: (range: DateRange) => void;
  className?: string;
  labels?: Partial<Record<DatePreset, string>>;
}

const DEFAULT_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_month: 'This month',
  last_month: 'Last month',
  custom: 'Custom',
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

function rangeFor(preset: DatePreset, custom?: { from: string; to: string }): DateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'today':
      return { preset, from: iso(now), to: iso(now) };
    case 'yesterday': {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { preset, from: iso(d), to: iso(d) };
    }
    case 'this_month':
      return { preset, from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
    case 'last_month':
      return { preset, from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'custom':
      return { preset, from: custom?.from ?? iso(now), to: custom?.to ?? iso(now) };
  }
}

/** Date preset tabs (Today · Yesterday · This/Last month · Custom) — the core
 *  dashboard/finances filter pattern. Emits a resolved {from,to,preset}. */
export function DateFilterTabs({ value = 'today', onChange, className, labels }: DateFilterTabsProps) {
  const [active, setActive] = useState<DatePreset>(value);
  const [custom, setCustom] = useState({ from: iso(new Date()), to: iso(new Date()) });
  const presets = useMemo(() => ['today', 'yesterday', 'this_month', 'last_month', 'custom'] as const, []);

  const pick = (p: DatePreset) => {
    setActive(p);
    onChange(rangeFor(p, custom));
  };

  const label = (p: DatePreset) => labels?.[p] ?? DEFAULT_LABELS[p];

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="inline-flex rounded-2lg border border-gray-200 bg-white p-0.5 shadow-search" role="tablist">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active === p}
            onClick={() => pick(p)}
            className={cn(
              'rounded-[8px] px-3 py-1.5 text-2xs font-medium transition-colors',
              active === p ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {label(p)}
          </button>
        ))}
      </div>
      {active === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={custom.from}
            onChange={(e) => {
              const next = { ...custom, from: e.target.value };
              setCustom(next);
              onChange(rangeFor('custom', next));
            }}
            className="rounded-2lg border border-gray-200 bg-white px-2 py-1 text-2xs text-gray-700 focus:border-primary focus:outline-none"
            aria-label="From date"
          />
          <span className="text-gray-400">–</span>
          <input
            type="date"
            value={custom.to}
            onChange={(e) => {
              const next = { ...custom, to: e.target.value };
              setCustom(next);
              onChange(rangeFor('custom', next));
            }}
            className="rounded-2lg border border-gray-200 bg-white px-2 py-1 text-2xs text-gray-700 focus:border-primary focus:outline-none"
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}
