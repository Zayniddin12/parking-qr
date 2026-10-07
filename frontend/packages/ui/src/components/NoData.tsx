import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface NoDataProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Empty-state placeholder used across tables and lists. */
export function NoData({ title = 'No data', description, icon, action, className }: NoDataProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <div className="text-3xl text-gray-400" aria-hidden="true">
        {icon ?? '∅'}
      </div>
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      {description && <div className="max-w-xs text-2xs text-gray-500">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
