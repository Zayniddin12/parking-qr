/**
 * Domain-status → `StatusPill`/`Badge` mappers. Kept separate from the
 * component module so React Fast Refresh stays happy (a file may export either
 * components or helpers, not both). Status is never color-only — the pill always
 * carries an icon + text label.
 */
import { Badge, StatusPill, type Status } from '@autoparking/ui';

const BRANCH_STATUS: Record<string, Status> = {
  active: 'allowed',
  suspended: 'watchlist',
  archived: 'offline',
};
const HEALTH_STATUS: Record<string, Status> = {
  online: 'online',
  degraded: 'degraded',
  offline: 'offline',
  unknown: 'low_confidence',
};
const PERMIT_STATUS: Record<string, Status> = {
  active: 'allowed',
  expired: 'offline',
  revoked: 'denied',
};
const VISIT_STATUS: Record<string, Status> = {
  open: 'online',
  paid: 'paid',
  exited: 'allowed',
  waived: 'watchlist',
  manual_override: 'override',
  lost_ticket: 'debt',
  unmatched: 'low_confidence',
};
const PAYMENT_STATUS: Record<string, Status> = {
  succeeded: 'paid',
  pending: 'debt',
  failed: 'denied',
  reversed: 'watchlist',
};
const CHARGE_STATUS: Record<string, Status> = {
  captured: 'paid',
  authorized: 'allowed',
  pending: 'debt',
  failed: 'denied',
  refunded: 'watchlist',
  waived: 'override',
  canceled: 'offline',
};
const LIST_STATUS: Record<string, Status> = {
  whitelist: 'whitelist',
  blacklist: 'blacklist',
  watchlist: 'watchlist',
};
const CODE_STATUS: Record<string, Status> = {
  issued: 'allowed',
  redeemed: 'paid',
  expired: 'offline',
  revoked: 'denied',
};

function pill(map: Record<string, Status>, value: string | null | undefined, label?: string) {
  if (!value) return <>—</>;
  const s = map[value];
  return s ? <StatusPill status={s} label={label ?? value} /> : <Badge>{label ?? value}</Badge>;
}

export const branchStatusPill = (v?: string | null, label?: string) => pill(BRANCH_STATUS, v, label);
export const healthPill = (v?: string | null, label?: string) => pill(HEALTH_STATUS, v, label);
export const permitStatusPill = (v?: string | null, label?: string) => pill(PERMIT_STATUS, v, label);
export const visitOutcomePill = (v?: string | null, label?: string) => pill(VISIT_STATUS, v, label);
export const paymentStatusPill = (v?: string | null, label?: string) => pill(PAYMENT_STATUS, v, label);
export const chargeStatusPill = (v?: string | null, label?: string) => pill(CHARGE_STATUS, v, label);
export const listKindPill = (v?: string | null, label?: string) => pill(LIST_STATUS, v, label);
export const codeStatusPill = (v?: string | null, label?: string) => pill(CODE_STATUS, v, label);
