import type { ReactNode } from 'react';

export interface LAuthProps {
  children: ReactNode;
  brand?: string;
  brandMark?: string;
  title?: string;
  subtitle?: string;
}

/** Unauthenticated layout (login/reset) — centered card on the app background. */
export function LAuth({ children, brand = 'AutoParking', brandMark = 'AP', title, subtitle }: LAuthProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2lg bg-primary text-lg font-bold text-white">
            {brandMark}
          </span>
          <span className="text-lg font-semibold text-gray-700">{brand}</span>
        </div>
        <div className="rounded-2lg border border-gray-200 bg-white p-8 shadow-auth">
          {title && <h1 className="mb-1 text-xl font-semibold text-gray-700">{title}</h1>}
          {subtitle && <p className="mb-6 text-2xs text-gray-500">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
