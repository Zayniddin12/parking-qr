import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned actions (buttons, filters). */
  actions?: ReactNode;
  className?: string;
}

/** Standard page title block used at the top of every module screen. */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
        {subtitle && <p className="mt-1 text-2xs text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
