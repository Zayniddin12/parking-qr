import { type ReactNode, useState } from 'react';
import { cn } from '../lib/cn';
import { Pagination } from './Pagination';
import { NoData } from './NoData';
import { Shimmer } from './Loader';

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  /** Custom cell renderer; falls back to `row[key]`. */
  render?: (row: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  head: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  /** Stable row key extractor. */
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  // search
  searchable?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  // pagination (server-side friendly: pass total)
  total?: number;
  currentPage?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  emptyTitle?: string;
  className?: string;
}

/**
 * Data table with header, custom cells, loading shimmer, empty state, optional
 * search box and pagination — the workhorse of ~80% of panel screens
 * (DESIGN-ALIGNMENT §3). Generic over the row type.
 */
export function Table<T>({
  head,
  data,
  loading = false,
  rowKey,
  onRowClick,
  searchable = false,
  searchValue,
  searchPlaceholder = 'Search…',
  onSearch,
  total,
  currentPage = 1,
  limit = 25,
  onPageChange,
  onLimitChange,
  emptyTitle = 'No records',
  className,
}: TableProps<T>) {
  const [innerSearch, setInnerSearch] = useState('');
  const search = searchValue ?? innerSearch;
  const showPagination = onPageChange !== undefined && total !== undefined;

  const align = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('overflow-hidden rounded-2lg border border-gray-200 bg-white shadow-card', className)}>
      {searchable && (
        <div className="border-b border-gray-200 p-3">
          <input
            type="search"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(e) => {
              setInnerSearch(e.target.value);
              onSearch?.(e.target.value);
            }}
            aria-label="Search table"
            className="w-full max-w-xs rounded-2lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-search placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              {head.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn('px-4 py-3 text-2xs font-semibold uppercase tracking-wide text-gray-500', align(col.align))}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, r) => (
                <tr key={`sk-${r}`} className="border-b border-gray-100">
                  {head.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Shimmer />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={head.length}>
                  <NoData title={emptyTitle} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-gray-100 transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-gray-100/60',
                  )}
                >
                  {head.map((col) => {
                    const raw = (row as Record<string, unknown>)[col.key];
                    return (
                      <td key={col.key} className={cn('px-4 py-3 text-gray-700', align(col.align))}>
                        {col.render ? col.render(row, i) : (raw as ReactNode) ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="border-t border-gray-200">
          <Pagination
            total={total}
            currentPage={currentPage}
            pageSize={limit}
            onPageChange={onPageChange}
            onPageSizeChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
}
