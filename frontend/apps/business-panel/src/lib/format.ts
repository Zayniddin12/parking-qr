/** Date/time + misc display helpers. */

const dtf = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
const df = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** ISO datetime → "dd.mm.yyyy hh:mm" (local), or "—" when empty. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dtf.format(d);
}

/** ISO date/datetime → "dd.mm.yyyy" (local), or "—" when empty. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : df.format(d);
}

/** Human "time ago" for last-seen columns. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const secs = Math.round((Date.now() - d) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

/** Short id chip, e.g. 8 leading hex chars of a UUID. */
export function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.slice(0, 8);
}

/** Extract a readable message from an unknown thrown error. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { status?: number; message?: string };
    if (typeof e.status === 'number' && e.status > 0) return `${e.status} ${e.message ?? ''}`.trim();
    if (typeof e.message === 'string') return e.message;
  }
  return 'Request failed';
}
