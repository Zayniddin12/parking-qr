/**
 * Money helpers. All API amounts are integer UZS tiyin (1 UZS = 100 tiyin) —
 * never floats. These convert for display/input only; values sent back to the
 * API are always integer tiyin.
 */
import type { Tiyin } from './apiTypes';

const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

/** Format integer tiyin as a grouped UZS string, e.g. 500000 → "5 000". */
export function formatTiyin(tiyin: Tiyin | null | undefined): string {
  if (tiyin === null || tiyin === undefined) return '—';
  return nf.format(tiyin / 100);
}

/** Format integer tiyin with a trailing currency label, e.g. "5 000 UZS". */
export function formatUZS(tiyin: Tiyin | null | undefined, currency = 'UZS'): string {
  if (tiyin === null || tiyin === undefined) return '—';
  return `${formatTiyin(tiyin)} ${currency}`;
}

/** Parse a UZS decimal string (from a form input) into integer tiyin. */
export function uzsToTiyin(uzs: string | number): Tiyin {
  const n = typeof uzs === 'number' ? uzs : Number(uzs.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer tiyin to a UZS decimal (for prefilling a form input). */
export function tiyinToUzs(tiyin: Tiyin | null | undefined): string {
  if (tiyin === null || tiyin === undefined) return '';
  return String(tiyin / 100);
}
