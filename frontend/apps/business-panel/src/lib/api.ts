/**
 * App-local Management API client for the Business Panel.
 *
 * Reuses the shared `HttpClient` (Bearer + Accept-Language + Idempotency-Key +
 * 401 handling) as a READ-ONLY import, but declares the full operator endpoint
 * surface locally so the app can consume all 60 Management routes without
 * editing the shared `@autoparking/api-client` package.
 *
 * The Bearer is the live OIDC access token kept in sync by `<AuthProvider>`;
 * the backend scopes every row to the caller's tenant via forced RLS.
 */
import { HttpClient } from '@autoparking/api-client';
import { getAccessToken } from '@autoparking/auth';
import { i18n } from '@autoparking/i18n';
import { config } from '../config';
import type {
  BranchCreate,
  BranchOut,
  BranchUpdate,
  ChargeFilters,
  ChargeOut,
  DashboardReport,
  DeviceGroupOut,
  DeviceOut,
  EdgeNodeOut,
  ListEntryCreate,
  ListEntryOut,
  ListEntryUpdate,
  ListKind,
  MemberMe,
  OccupancyPoint,
  OrganizationOut,
  OrganizationUpdate,
  Page,
  PartnerOrgCreate,
  PartnerOrgOut,
  PaymentFilters,
  PaymentOut,
  PermitCreate,
  PermitFilters,
  PermitOut,
  RatePlanOut,
  RatePlanPublish,
  RedemptionOut,
  RevenueByDayPoint,
  RevenueReport,
  RoleInfo,
  SubscriptionPlanCreate,
  SubscriptionPlanOut,
  SubscriptionPlanUpdate,
  TopPlate,
  UUID,
  ValidationCodeIssue,
  ValidationCodeOut,
  ValidationProgramCreate,
  ValidationProgramOut,
  ValidationProgramUpdate,
  VisitFilters,
  VisitOut,
} from './apiTypes';

const http = new HttpClient({
  baseUrl: config.managementApiUrl,
  getAccessToken,
  getLocale: () => i18n.language,
  // Cross-origin from the API in dev; rely on the Bearer, not a session cookie.
  withCredentials: false,
});

/** Drop `undefined`/empty values so we never send `?x=undefined`. */
type Q = Record<string, string | number | boolean | undefined>;
function q(params: object): Q {
  const out: Q = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v as string | number | boolean;
  }
  return out;
}

export const api = {
  // --- tenancy / members ---------------------------------------------------
  listOrganizations: () => http.get<OrganizationOut[]>('/orgs'),
  getOrganization: (id: UUID) => http.get<OrganizationOut>(`/orgs/${id}`),
  updateOrganization: (id: UUID, body: OrganizationUpdate) =>
    http.patch<OrganizationOut>(`/orgs/${id}`, { body }),

  me: () => http.get<MemberMe>('/members/me'),
  listRoles: () => http.get<RoleInfo[]>('/members/roles'),

  // --- branches ------------------------------------------------------------
  listBranches: () => http.get<BranchOut[]>('/branches'),
  getBranch: (id: UUID) => http.get<BranchOut>(`/branches/${id}`),
  createBranch: (body: BranchCreate) => http.post<BranchOut>('/branches', { body }),
  updateBranch: (id: UUID, body: BranchUpdate) => http.patch<BranchOut>(`/branches/${id}`, { body }),
  archiveBranch: (id: UUID) => http.delete<void>(`/branches/${id}`),
  branchRatePlans: (id: UUID) => http.get<RatePlanOut[]>(`/branches/${id}/rate-plans`),
  branchDevices: (id: UUID) => http.get<DeviceOut[]>(`/branches/${id}/devices`),

  // --- fleet ---------------------------------------------------------------
  listDevices: (branchId?: UUID) =>
    http.get<DeviceOut[]>('/devices', { query: q({ branch_id: branchId }) }),
  getDevice: (id: UUID) => http.get<DeviceOut>(`/devices/${id}`),
  listDeviceGroups: (branchId?: UUID) =>
    http.get<DeviceGroupOut[]>('/device-groups', { query: q({ branch_id: branchId }) }),
  listEdgeNodes: (branchId?: UUID) =>
    http.get<EdgeNodeOut[]>('/edge-nodes', { query: q({ branch_id: branchId }) }),
  getEdgeNode: (id: UUID) => http.get<EdgeNodeOut>(`/edge-nodes/${id}`),

  // --- tariffs -------------------------------------------------------------
  listRatePlans: (branchId?: UUID) =>
    http.get<RatePlanOut[]>('/rate-plans', { query: q({ branch_id: branchId }) }),
  activeRatePlan: (branchId: UUID) =>
    http.get<RatePlanOut>('/rate-plans/active', { query: q({ branch_id: branchId }) }),
  getRatePlan: (id: UUID) => http.get<RatePlanOut>(`/rate-plans/${id}`),
  publishRatePlan: (body: RatePlanPublish) => http.post<RatePlanOut>('/rate-plans', { body }),

  // --- subscription plans --------------------------------------------------
  listSubscriptionPlans: (branchId?: UUID) =>
    http.get<SubscriptionPlanOut[]>('/subscription-plans', { query: q({ branch_id: branchId }) }),
  getSubscriptionPlan: (id: UUID) => http.get<SubscriptionPlanOut>(`/subscription-plans/${id}`),
  createSubscriptionPlan: (body: SubscriptionPlanCreate) =>
    http.post<SubscriptionPlanOut>('/subscription-plans', { body }),
  updateSubscriptionPlan: (id: UUID, body: SubscriptionPlanUpdate) =>
    http.patch<SubscriptionPlanOut>(`/subscription-plans/${id}`, { body }),

  // --- permits -------------------------------------------------------------
  listPermits: (f: PermitFilters = {}) => http.get<Page<PermitOut>>('/permits', { query: q(f) }),
  getPermit: (id: UUID) => http.get<PermitOut>(`/permits/${id}`),
  createPermit: (body: PermitCreate) => http.post<PermitOut>('/permits', { body }),
  permitPayments: (id: UUID) => http.get<PaymentOut[]>(`/permits/${id}/payments`),

  // --- visits (sessions) ---------------------------------------------------
  listVisits: (f: VisitFilters = {}) => http.get<Page<VisitOut>>('/visits', { query: q(f) }),
  getVisit: (id: UUID) => http.get<VisitOut>(`/visits/${id}`),
  visitPayments: (id: UUID) => http.get<PaymentOut[]>(`/visits/${id}/payments`),

  // --- payments / charges (read-only) --------------------------------------
  listPayments: (f: PaymentFilters = {}) => http.get<Page<PaymentOut>>('/payments', { query: q(f) }),
  getPayment: (id: UUID) => http.get<PaymentOut>(`/payments/${id}`),
  listCharges: (f: ChargeFilters = {}) => http.get<Page<ChargeOut>>('/charges', { query: q(f) }),
  getCharge: (id: UUID) => http.get<ChargeOut>(`/charges/${id}`),

  // --- lists (white/black/watch) -------------------------------------------
  listListEntries: (kind?: ListKind, branchId?: UUID) =>
    http.get<ListEntryOut[]>('/lists', { query: q({ kind, branch_id: branchId }) }),
  getListEntry: (id: UUID) => http.get<ListEntryOut>(`/lists/${id}`),
  createListEntry: (body: ListEntryCreate) => http.post<ListEntryOut>('/lists', { body }),
  updateListEntry: (id: UUID, body: ListEntryUpdate) =>
    http.patch<ListEntryOut>(`/lists/${id}`, { body }),
  deleteListEntry: (id: UUID) => http.delete<void>(`/lists/${id}`),

  // --- validation ----------------------------------------------------------
  listPartnerOrgs: () => http.get<PartnerOrgOut[]>('/partner-orgs'),
  getPartnerOrg: (id: UUID) => http.get<PartnerOrgOut>(`/partner-orgs/${id}`),
  createPartnerOrg: (body: PartnerOrgCreate) => http.post<PartnerOrgOut>('/partner-orgs', { body }),

  listValidationPrograms: (branchId?: UUID) =>
    http.get<ValidationProgramOut[]>('/validation-programs', { query: q({ branch_id: branchId }) }),
  getValidationProgram: (id: UUID) => http.get<ValidationProgramOut>(`/validation-programs/${id}`),
  createValidationProgram: (body: ValidationProgramCreate) =>
    http.post<ValidationProgramOut>('/validation-programs', { body }),
  updateValidationProgram: (id: UUID, body: ValidationProgramUpdate) =>
    http.patch<ValidationProgramOut>(`/validation-programs/${id}`, { body }),
  listValidationCodes: (id: UUID) =>
    http.get<ValidationCodeOut[]>(`/validation-programs/${id}/codes`),
  issueValidationCode: (id: UUID, body: ValidationCodeIssue = {}) =>
    http.post<ValidationCodeOut>(`/validation-programs/${id}/codes`, { body }),
  listRedemptions: (id: UUID) =>
    http.get<RedemptionOut[]>(`/validation-programs/${id}/redemptions`),

  // --- reporting -----------------------------------------------------------
  dashboard: (branchId: UUID) =>
    http.get<DashboardReport>('/reports/dashboard', { query: q({ branch_id: branchId }) }),
  revenueReport: (branchId: UUID, from?: string, to?: string) =>
    http.get<RevenueReport>('/reports/revenue', { query: q({ branch_id: branchId, from, to }) }),
  occupancy: (branchId: UUID) =>
    http.get<OccupancyPoint>('/reports/occupancy', { query: q({ branch_id: branchId }) }),
  revenueByDay: (branchId: UUID, days = 30) =>
    http.get<RevenueByDayPoint[]>('/reports/revenue-by-day', {
      query: q({ branch_id: branchId, days }),
    }),
  topPlates: (branchId: UUID, limit = 10) =>
    http.get<TopPlate[]>('/reports/top-plates', { query: q({ branch_id: branchId, limit }) }),
};

export type Api = typeof api;
