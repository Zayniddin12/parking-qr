import { useEffect, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  show: boolean;
  title?: ReactNode;
  size?: ModalSize;
  onClose: () => void;
  /** Disable closing on backdrop click / Escape (e.g. required forms). */
  dismissable?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

const SIZE: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Accessible modal dialog with backdrop, Escape-to-close and body scroll-lock. */
export function Modal({ show, title, size = 'md', onClose, dismissable = true, footer, children }: ModalProps) {
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [show, dismissable, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm animate-[fadeIn_.15s_ease]"
        onClick={() => dismissable && onClose()}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden rounded-2lg bg-white shadow-auth',
          SIZE[size],
        )}
      >
        {(title || dismissable) && (
          <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-700">{title}</h2>
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-2lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </header>
        )}
        <div className="max-h-[70vh] overflow-auto px-5 py-4 text-sm text-gray-700">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
