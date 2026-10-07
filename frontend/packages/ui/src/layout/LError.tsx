import type { ReactNode } from 'react';

export interface LErrorProps {
  code?: string | number;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/** Full-page error layout (404 / 403 / 500). */
export function LError({ code = '404', title = 'Page not found', description, action }: LErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app px-4 text-center font-sans">
      <div className="text-4.5xl font-bold text-primary">{code}</div>
      <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
      {description && <p className="max-w-md text-2xs text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
