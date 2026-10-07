/**
 * Hand-maintained TypeScript mirror of the shared contract
 * (contracts/openapi.yaml). Kept in sync with the single source of truth; in CI
 * these are regenerated from the spec. Money is ALWAYS integer `Tiyin`.
 *
 * These types describe the MANAGEMENT plane (Python/FastAPI) request/response
 * shapes the web panels consume, plus the few core governance responses the
 * attendant panel needs (barrier override).
 */

/** Money in UZS tiyin (1 UZS = 100 tiyin). Integer only — never float. */
export type Tiyin = number;
export type UUID = string;
export type ISODateTime = string;

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Organization {
  id: UUID;
  slug: string;
  name: string;
  isolation_tier: 'pool' | 'silo';
  plan_code: string;
  region: string;
  status: 'active' | 'suspended' | 'closed';
}

export interface Branch {
  id?: UUID;
  tenant_id?: UUID;
  name: string;
  address?: string;
  timezone?: string;
  active_rate_plan_id?: UUID;
  billing_status?: 'current' | 'past_due' | 'blocked';
  fail_policy?: Record<string, unknown>;
  status?: 'active' | 'suspended' | 'archived';
}

export type DeviceType =
  | 'camera'
  | 'barrier_relay'
  | 'card_terminal'
  | 'cash_acceptor'
  | 'kiosk'
  | 'sensor'
  | 'display';

export interface Device {
  id: UUID;
  branch_id: UUID;
  type: DeviceType;
  name: string;
  health: 'unknown' | 'online' | 'degraded' | 'offline';
  config?: Record<string, unknown>;
}

export interface RatePlan {
  id?: UUID;
  branch_id: UUID;
  version?: number;
  currency?: string;
  doc: Record<string, unknown>;
  signature?: string;
  status?: 'draft' | 'published' | 'superseded';
  effective_from: ISODateTime;
}

export interface Permit {
  id?: UUID;
  branch_id: UUID;
  vehicle_id: UUID;
  kind: 'session' | 'subscription' | 'whitelist';
  subscription_plan_id?: UUID;
  valid_from?: ISODateTime;
  valid_to?: ISODateTime;
  status?: 'active' | 'expired' | 'revoked';
}

export type ListKind = 'whitelist' | 'blacklist' | 'watchlist';

export interface ListEntry {
  id?: UUID;
  kind: ListKind;
  scope: 'branch' | 'organization' | 'global';
  scope_id?: UUID;
  plate: string;
  country?: string;
  policy?: Record<string, unknown>;
  version?: number;
  reason?: string;
  valid_from?: ISODateTime;
  valid_to?: ISODateTime;
}

export interface ValidationProgram {
  id?: UUID;
  branch_id: UUID;
  partner_org_id: UUID;
  name?: string;
  kind: 'flat' | 'percent' | 'hours_free' | 'free' | 'price_list';
  params?: Record<string, unknown>;
  stackable?: boolean;
  priority?: number;
  monthly_budget_tiyin?: Tiyin;
}

export interface ValidationCode {
  id: UUID;
  program_id: UUID;
  jti: string;
  token: string;
  status: 'issued' | 'redeemed' | 'expired' | 'revoked';
  expires_at: ISODateTime;
}

export type PaymentMethod =
  | 'payme'
  | 'click'
  | 'uzum'
  | 'paynet'
  | 'multicard'
  | 'vtk_card'
  | 'cash_nv200'
  | 'qr';

export interface CreateChargeRequest {
  branch_id: UUID;
  visit_id?: UUID;
  amount_tiyin: Tiyin;
  method: PaymentMethod;
  reason_code?: string;
}

export interface Charge {
  id: UUID;
  branch_id: UUID;
  visit_id?: UUID;
  amount_tiyin: Tiyin;
  currency?: string;
  method: PaymentMethod;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'waived' | 'canceled';
  idempotency_key?: string;
}

export type OverrideAction = 'open_pulse' | 'hold_open' | 'close';
export type OverrideReason =
  | 'fire_emergency'
  | 'anpr_failure'
  | 'vip'
  | 'stuck_vehicle'
  | 'device_fault'
  | 'event_free_flow'
  | 'other';

export interface BarrierOverrideRequest {
  action: OverrideAction;
  reason_code: OverrideReason;
  note?: string;
  plate?: string;
  visit_id?: UUID;
}

export interface ManualOverride {
  id: UUID;
  seq: number;
  prev_hash: string;
  entry_hash: string;
  action: string;
  reason_code: string;
  amount_waived_tiyin?: Tiyin;
  snapshot_ref?: string;
  sig?: string;
  server_ts: ISODateTime;
}

export interface RevenueReport {
  branch_id: UUID;
  gross_tiyin: Tiyin;
  net_tiyin: Tiyin;
  unmatched_exits: number;
}
