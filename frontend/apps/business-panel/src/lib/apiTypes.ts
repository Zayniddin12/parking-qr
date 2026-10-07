/**
 * App-local TypeScript mirror of the Management plane (FastAPI) request/response
 * shapes the Business Panel consumes. The shared `@autoparking/api-client`
 * package only exports a small slice of the contract; this file covers the full
 * operator surface (60 endpoints) without touching the shared package.
 *
 * Kept in lock-step with `Management/app/schemas/*`. Money is ALWAYS integer
 * `Tiyin` — never a float.
 */
import type { Tiyin, UUID, ISODateTime, PaymentMethod, ListKind } from '@autoparking/api-client';

export type { Tiyin, UUID, ISODateTime, PaymentMethod, ListKind };

/** Standard paginated list envelope returned by `/permits`, `/visits`,
 *  `/payments`, `/charges`. `count` is the TOTAL matching rows (for paging). */
export interface Page<T> {
  count: number;
  results: T[];
}

/** Shared limit/offset paging (limit 1..200, default 50). */
export interface PageParams {
  limit?: number;
  offset?: number;
}

// --- tenancy ---------------------------------------------------------------

export type OrgStatus = 'active' | 'suspended' | 'closed';

export interface OrganizationOut {
  id: UUID;
  slug: string;
  name: string;
  isolation_tier: 'pool' | 'silo';
  plan_code: string;
  region: string;
  status: OrgStatus;
  stir?: string | null;
  settings: Record<string, unknown>;
}

export interface OrganizationUpdate {
  name?: string;
  stir?: string | null;
  settings?: Record<string, unknown>;
}

export type BranchStatus = 'active' | 'suspended' | 'archived';
export type BillingStatus = 'current' | 'past_due' | 'blocked';

export interface BranchOut {
  id: UUID;
  tenant_id: UUID;
  name: string;
  address: string | null;
  timezone: string;
  active_rate_plan_id: UUID | null;
  billing_status: BillingStatus;
  fail_policy: Record<string, unknown>;
  status: BranchStatus;
}

export interface BranchCreate {
  name: string;
  address?: string;
  timezone?: string;
  fail_policy?: Record<string, unknown>;
}

export interface BranchUpdate {
  name?: string;
  address?: string;
  timezone?: string;
  active_rate_plan_id?: UUID;
  billing_status?: BillingStatus;
  fail_policy?: Record<string, unknown>;
  status?: BranchStatus;
}

// --- fleet -----------------------------------------------------------------

export type DeviceType =
  | 'camera'
  | 'barrier_relay'
  | 'card_terminal'
  | 'cash_acceptor'
  | 'kiosk'
  | 'sensor'
  | 'display';
export type DeviceHealth = 'unknown' | 'online' | 'degraded' | 'offline';
export type DeviceGroupKind = 'poc_gate' | 'pos_point';
export type LicenseState = 'unprovisioned' | 'active' | 'grace' | 'revoked' | 'expired';

export interface DeviceOut {
  id: UUID;
  branch_id: UUID;
  group_id?: UUID | null;
  type: DeviceType;
  name: string;
  ip?: string | null;
  driver?: string | null;
  health: DeviceHealth;
  config: Record<string, unknown>;
  last_seen?: ISODateTime | null;
}

export interface DeviceGroupOut {
  id: UUID;
  branch_id: UUID;
  name: string;
  kind: DeviceGroupKind;
  config: Record<string, unknown>;
}

export interface EdgeNodeOut {
  id: UUID;
  branch_id: UUID;
  hardware_id: string;
  fw_version?: string | null;
  app_version?: string | null;
  license_state: LicenseState;
  last_seen?: ISODateTime | null;
}

// --- tariffs ---------------------------------------------------------------

export type RatePlanStatus = 'draft' | 'published' | 'superseded';

export interface RatePlanOut {
  id: UUID;
  branch_id: UUID;
  version: number;
  currency: string;
  doc: Record<string, unknown>;
  signature: string | null;
  status: RatePlanStatus;
  effective_from: ISODateTime;
}

export interface RatePlanPublish {
  branch_id: UUID;
  currency?: string;
  doc: Record<string, unknown>;
  effective_from: ISODateTime;
  publish?: boolean;
}

// --- parking: permits / visits / subscription plans ------------------------

export type PermitKind = 'session' | 'subscription' | 'whitelist';
export type PermitStatus = 'active' | 'expired' | 'revoked';

export interface PermitOut {
  id: UUID;
  branch_id: UUID;
  vehicle_id: UUID;
  kind: PermitKind;
  subscription_plan_id: UUID | null;
  valid_from: ISODateTime;
  valid_to: ISODateTime | null;
  status: PermitStatus;
}

export interface PermitCreate {
  branch_id: UUID;
  vehicle_id: UUID;
  kind: PermitKind;
  subscription_plan_id?: UUID;
  valid_from?: ISODateTime;
  valid_to?: ISODateTime;
}

export type VisitOutcome =
  | 'open'
  | 'paid'
  | 'exited'
  | 'waived'
  | 'manual_override'
  | 'lost_ticket'
  | 'unmatched';

export interface VisitOut {
  id: UUID;
  branch_id: UUID;
  vehicle_id: UUID | null;
  permit_id: UUID | null;
  entry_ts: ISODateTime;
  exit_ts: ISODateTime | null;
  rate_plan_id: UUID | null;
  rate_plan_version: number | null;
  fee_breakdown: unknown[];
  discounts: unknown[];
  outcome: VisitOutcome;
  amount_due_tiyin: Tiyin;
}

export type SubscriptionPlanStatus = 'draft' | 'active' | 'archived';

export interface SubscriptionPlanOut {
  id: UUID;
  branch_id: UUID;
  code: string;
  name: string;
  price_tiyin: Tiyin;
  period_days: number;
  entries_limit: number | null;
  valid_hours: Record<string, unknown>;
  status: SubscriptionPlanStatus;
}

export interface SubscriptionPlanCreate {
  branch_id: UUID;
  code: string;
  name: string;
  price_tiyin: Tiyin;
  period_days: number;
  entries_limit?: number;
  valid_hours?: Record<string, unknown>;
  status?: SubscriptionPlanStatus;
}

export interface SubscriptionPlanUpdate {
  name?: string;
  price_tiyin?: Tiyin;
  period_days?: number;
  entries_limit?: number;
  valid_hours?: Record<string, unknown>;
  status?: SubscriptionPlanStatus;
}

// --- payments (read-only in Management) ------------------------------------

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'reversed';
export type ChargeStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'waived'
  | 'canceled';

export interface PaymentOut {
  id: UUID;
  branch_id: UUID;
  charge_id: UUID;
  visit_id: UUID | null;
  method: PaymentMethod;
  amount_tiyin: Tiyin;
  status: PaymentStatus;
  provider_ref: string | null;
  settled_at: ISODateTime | null;
  created_at: ISODateTime;
}

export interface ChargeOut {
  id: UUID;
  branch_id: UUID;
  visit_id: UUID | null;
  amount_tiyin: Tiyin;
  currency: string;
  method: PaymentMethod;
  status: ChargeStatus;
  reason_code: string | null;
  created_at: ISODateTime;
}

// --- lists (white/black/watch) ---------------------------------------------

export type ListScope = 'branch' | 'organization' | 'global';

export interface ListEntryOut {
  id: UUID;
  kind: ListKind;
  scope: ListScope;
  scope_id: UUID | null;
  plate: string;
  country: string;
  policy: Record<string, unknown>;
  version: number;
  reason: string | null;
  valid_from: ISODateTime;
  valid_to: ISODateTime | null;
}

export interface ListEntryCreate {
  kind: ListKind;
  scope: ListScope;
  scope_id?: UUID;
  plate: string;
  country?: string;
  policy?: Record<string, unknown>;
  reason?: string;
  valid_from?: ISODateTime;
  valid_to?: ISODateTime;
}

export interface ListEntryUpdate {
  policy?: Record<string, unknown>;
  reason?: string;
  valid_from?: ISODateTime;
  valid_to?: ISODateTime;
}

// --- validation ------------------------------------------------------------

export type ValidationKind = 'flat' | 'percent' | 'hours_free' | 'free' | 'price_list';

export interface ValidationProgramOut {
  id: UUID;
  branch_id: UUID;
  partner_org_id: UUID;
  name: string;
  kind: ValidationKind;
  params: Record<string, unknown>;
  stackable: boolean;
  priority: number;
  monthly_budget_tiyin: Tiyin | null;
}

export interface ValidationProgramCreate {
  branch_id: UUID;
  partner_org_id: UUID;
  name: string;
  kind: ValidationKind;
  params?: Record<string, unknown>;
  stackable?: boolean;
  priority?: number;
  per_code_limit?: number;
  per_day_limit?: number;
  per_plate_limit?: number;
  monthly_budget_tiyin?: Tiyin;
  valid_from?: ISODateTime;
  valid_to?: ISODateTime;
}

export interface ValidationProgramUpdate {
  name?: string;
  params?: Record<string, unknown>;
  stackable?: boolean;
  priority?: number;
  per_code_limit?: number;
  per_day_limit?: number;
  per_plate_limit?: number;
  monthly_budget_tiyin?: Tiyin;
  valid_to?: ISODateTime;
}

export type ValidationCodeStatus = 'issued' | 'redeemed' | 'expired' | 'revoked';

export interface ValidationCodeOut {
  id: UUID;
  program_id: UUID;
  jti: string;
  token: string;
  status: ValidationCodeStatus;
  expires_at: ISODateTime;
}

export interface ValidationCodeIssue {
  ttl_seconds?: number;
  nonce?: string;
}

export interface RedemptionOut {
  id: UUID;
  branch_id: UUID;
  code_id: UUID;
  visit_id: UUID | null;
  amount_tiyin: Tiyin;
  redeemed_at: ISODateTime;
}

export interface PartnerOrgOut {
  id: UUID;
  name: string;
  contact: Record<string, unknown>;
}

export interface PartnerOrgCreate {
  name: string;
  contact?: Record<string, unknown>;
}

// --- members / roles -------------------------------------------------------

export interface MemberMe {
  user_id: UUID | null;
  tenant_id: UUID;
  roles: string[];
}

export interface RoleInfo {
  value: string;
  label: string;
}

// --- reporting -------------------------------------------------------------

export interface RevenueReport {
  branch_id: UUID;
  gross_tiyin: number;
  net_tiyin: number;
  unmatched_exits: number;
}

export interface OccupancyPoint {
  branch_id: UUID;
  open_visits: number;
  paid_today: number;
  revenue_today_tiyin: Tiyin;
}

export interface RevenueByDayPoint {
  day: string; // YYYY-MM-DD
  gross_tiyin: number;
  net_tiyin: number;
  payments: number;
}

export interface TopPlate {
  plate: string;
  country: string;
  visits: number;
  revenue_tiyin: number;
}

export interface DashboardReport {
  branch_id: UUID;
  branches: number;
  devices: number;
  open_visits: number;
  visits_today: number;
  revenue_today_tiyin: Tiyin;
  revenue_month_tiyin: number;
  active_permits: number;
  blacklist_entries: number;
  revenue_by_day: RevenueByDayPoint[];
  top_plates: TopPlate[];
}

// --- filter param bags -----------------------------------------------------

export interface PermitFilters extends PageParams {
  branch_id?: UUID;
  plate?: string;
  kind?: PermitKind;
  from?: string;
  to?: string;
}

export interface VisitFilters extends PageParams {
  branch_id?: UUID;
  plate?: string;
  outcome?: VisitOutcome;
  from?: string;
  to?: string;
}

export interface PaymentFilters extends PageParams {
  branch_id?: UUID;
  method?: PaymentMethod;
  status?: PaymentStatus;
  from?: string;
  to?: string;
}

export interface ChargeFilters extends PageParams {
  branch_id?: UUID;
  method?: PaymentMethod;
  status?: ChargeStatus;
  from?: string;
  to?: string;
}
