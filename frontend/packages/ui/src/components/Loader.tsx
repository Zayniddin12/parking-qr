import { cn } from '../lib/cn';

export interface LoaderProps {
  /** Diameter in px. */
  size?: number;
  className?: string;
  label?: string;
}

/** Indeterminate spinner (accessible: role=status + label). */
export function Loader({ size = 20, className, label = 'Loading' }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block animate-spin rounded-full border-2 border-gray-200 border-t-primary', className)}
      style={{ width: size, height: size }}
    />
  );
}

export interface ShimmerProps {
  className?: string;
  /** Number of shimmer rows to render. */
  rows?: number;
}

/** Skeleton shimmer block(s) for loading states. */
export function Shimmer({ className, rows = 1 }: ShimmerProps) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('h-4 w-full animate-pulse rounded bg-gray-200/70', className)} />
      ))}
    </div>
  );
}
