import { cn } from '../lib/cn';

export interface PaginationProps {
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

/** Build a compact page window with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20. */
function pageWindow(current: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) out.push('gap');
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < totalPages - 1) out.push('gap');
  out.push(totalPages);
  return out;
}

/** Pagination + page-size selector (PageLimitChange). */
export function Pagination({
  total,
  currentPage,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(total, currentPage * pageSize);
  const pages = pageWindow(currentPage, totalPages);

  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-2lg px-2 text-2xs font-medium transition-colors';

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3', className)}
    >
      <span className="text-2xs text-gray-500">
        {from}–{to} / {total}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(btn, 'border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40')}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                btn,
                p === currentPage
                  ? 'bg-primary text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={cn(btn, 'border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40')}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      {onPageSizeChange && (
        <label className="flex items-center gap-2 text-2xs text-gray-500">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-2lg border border-gray-200 bg-white px-2 py-1 text-2xs text-gray-700 focus:border-primary focus:outline-none"
          >
            {pageSizeOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}
