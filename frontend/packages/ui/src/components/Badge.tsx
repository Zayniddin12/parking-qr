import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-600 ring-gray-200',
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-warning-50 text-warning-600 ring-warning-100',
  danger: 'bg-red-50 text-red-600 ring-red-200',
  info: 'bg-info-50 text-info-600 ring-info-100',
};

/** Generic colored badge (semantic tone) — never color-only; pass text/icon. */
export function Badge({ tone = 'neutral', children, className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-2lg px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
