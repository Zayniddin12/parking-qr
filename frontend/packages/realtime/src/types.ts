/**
 * Ledger event envelope, mirroring contracts/events.schema.json. These arrive
 * over the CORE SSE stream (GET /realtime/branches/{branchId}/ledger) fanned out
 * from NATS `ap.evt.*` (contracts/nats-subjects.md).
 *
 * `event_id` (UUIDv7) doubles as the SSE `id:` used for Last-Event-ID replay.
 * Money is ALWAYS integer tiyin.
 */

export type UUID = string;
export type Tiyin = number;

export type EventType =
  | 'plate.read'
  | 'visit.opened'
  | 'visit.closed'
  | 'permit.created'
  | 'payment.captured'
  | 'payment.reversed'
  | 'cash.inserted'
  | 'card.sale'
  | 'card.reversal'
  | 'barrier.opened'
  | 'manual.override'
  | 'validation.redeemed'
  | 'list.hit'
  | 'device.health'
  | 'edge.heartbeat';

export interface EventEnvelope<TData = Record<string, unknown>> {
  event_id: UUID;
  edge_seq: number;
  type: EventType;
  schema_version: 1;
  tenant_id: UUID;
  branch_id: UUID;
  edge_node_id: UUID;
  poc_id?: UUID;
  device_id?: UUID;
  edge_ts: string;
  sig?: string;
  data: TData;
}

export type Direction = 'enter' | 'exit';

export interface PlateReadData {
  plate: string;
  plate_canonical?: string;
  country: string;
  region?: string;
  confidence: number;
  vehicle_class?: 'A' | 'B' | 'C' | 'D';
  direction: Direction;
  best_crop_ref?: string;
  track_id?: string;
}

export interface VisitClosedData {
  visit_id: UUID;
  exit_ts: string;
  outcome: 'paid' | 'exited' | 'waived' | 'manual_override' | 'lost_ticket' | 'unmatched';
  rate_plan_id?: UUID;
  rate_plan_version?: number;
  amount_due_tiyin: Tiyin;
  discounts?: Array<Record<string, unknown>>;
}

export interface ListHitData {
  list_entry_id: UUID;
  kind: 'whitelist' | 'blacklist' | 'watchlist';
  plate: string;
  decision: 'allow_free' | 'deny_entry' | 'allow_notify' | 'default_tariff';
}

export interface PaymentCapturedData {
  charge_id: UUID;
  visit_id?: UUID;
  method: string;
  amount_tiyin: Tiyin;
}

export interface DeviceHealthData {
  health: 'online' | 'degraded' | 'offline';
  metrics?: Record<string, number>;
}

export type LedgerEvent =
  | EventEnvelope<PlateReadData> & { type: 'plate.read' }
  | (EventEnvelope<VisitClosedData> & { type: 'visit.closed' })
  | (EventEnvelope<ListHitData> & { type: 'list.hit' })
  | (EventEnvelope<PaymentCapturedData> & { type: 'payment.captured' | 'card.sale' })
  | (EventEnvelope<DeviceHealthData> & { type: 'device.health' })
  | EventEnvelope;
