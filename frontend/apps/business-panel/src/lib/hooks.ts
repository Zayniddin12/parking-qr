/**
 * React-Query hooks over the app-local Management API. One hook per resource,
 * with stable query keys and mutation invalidation. Consumed by every screen so
 * caching/refetch/error handling is uniform.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  BranchCreate,
  BranchUpdate,
  ChargeFilters,
  ListEntryCreate,
  ListEntryUpdate,
  ListKind,
  PartnerOrgCreate,
  PaymentFilters,
  PermitCreate,
  PermitFilters,
  RatePlanPublish,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  UUID,
  ValidationCodeIssue,
  ValidationProgramCreate,
  ValidationProgramUpdate,
  VisitFilters,
} from './apiTypes';

export const qk = {
  me: ['me'] as const,
  roles: ['roles'] as const,
  orgs: ['orgs'] as const,
  branches: ['branches'] as const,
  branch: (id: UUID) => ['branches', id] as const,
  branchRatePlans: (id: UUID) => ['branches', id, 'rate-plans'] as const,
  branchDevices: (id: UUID) => ['branches', id, 'devices'] as const,
  devices: (branchId?: UUID) => ['devices', branchId ?? 'all'] as const,
  deviceGroups: (branchId?: UUID) => ['device-groups', branchId ?? 'all'] as const,
  edgeNodes: (branchId?: UUID) => ['edge-nodes', branchId ?? 'all'] as const,
  ratePlans: (branchId?: UUID) => ['rate-plans', branchId ?? 'all'] as const,
  subscriptionPlans: (branchId?: UUID) => ['subscription-plans', branchId ?? 'all'] as const,
  permits: (f: PermitFilters) => ['permits', f] as const,
  permit: (id: UUID) => ['permits', id] as const,
  permitPayments: (id: UUID) => ['permits', id, 'payments'] as const,
  visits: (f: VisitFilters) => ['visits', f] as const,
  visit: (id: UUID) => ['visits', id] as const,
  visitPayments: (id: UUID) => ['visits', id, 'payments'] as const,
  payments: (f: PaymentFilters) => ['payments', f] as const,
  charges: (f: ChargeFilters) => ['charges', f] as const,
  lists: (kind?: ListKind, branchId?: UUID) => ['lists', kind ?? 'all', branchId ?? 'all'] as const,
  partnerOrgs: ['partner-orgs'] as const,
  validationPrograms: (branchId?: UUID) => ['validation-programs', branchId ?? 'all'] as const,
  validationProgram: (id: UUID) => ['validation-programs', id] as const,
  validationCodes: (id: UUID) => ['validation-programs', id, 'codes'] as const,
  redemptions: (id: UUID) => ['validation-programs', id, 'redemptions'] as const,
  dashboard: (branchId: UUID) => ['reports', 'dashboard', branchId] as const,
  revenueByDay: (branchId: UUID, days: number) =>
    ['reports', 'revenue-by-day', branchId, days] as const,
  topPlates: (branchId: UUID, limit: number) => ['reports', 'top-plates', branchId, limit] as const,
  occupancy: (branchId: UUID) => ['reports', 'occupancy', branchId] as const,
};

const enabled = (v: unknown) => v !== undefined && v !== null && v !== '';

// --- tenancy / members -----------------------------------------------------
export const useMe = () => useQuery({ queryKey: qk.me, queryFn: api.me });
export const useRoles = () => useQuery({ queryKey: qk.roles, queryFn: api.listRoles });
export const useOrganizations = () => useQuery({ queryKey: qk.orgs, queryFn: api.listOrganizations });

// --- branches --------------------------------------------------------------
export const useBranches = () => useQuery({ queryKey: qk.branches, queryFn: api.listBranches });
export const useBranch = (id?: UUID) =>
  useQuery({ queryKey: qk.branch(id!), queryFn: () => api.getBranch(id!), enabled: enabled(id) });
export const useBranchRatePlans = (id?: UUID) =>
  useQuery({
    queryKey: qk.branchRatePlans(id!),
    queryFn: () => api.branchRatePlans(id!),
    enabled: enabled(id),
  });
export const useBranchDevices = (id?: UUID) =>
  useQuery({
    queryKey: qk.branchDevices(id!),
    queryFn: () => api.branchDevices(id!),
    enabled: enabled(id),
  });

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BranchCreate) => api.createBranch(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.branches }),
  });
}
export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: BranchUpdate }) => api.updateBranch(id, body),
    onSuccess: (_d, { id }) => {
      void qc.invalidateQueries({ queryKey: qk.branches });
      void qc.invalidateQueries({ queryKey: qk.branch(id) });
    },
  });
}
export function useArchiveBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => api.archiveBranch(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.branches }),
  });
}

// --- fleet -----------------------------------------------------------------
export const useDevices = (branchId?: UUID) =>
  useQuery({ queryKey: qk.devices(branchId), queryFn: () => api.listDevices(branchId) });
export const useDeviceGroups = (branchId?: UUID) =>
  useQuery({ queryKey: qk.deviceGroups(branchId), queryFn: () => api.listDeviceGroups(branchId) });
export const useEdgeNodes = (branchId?: UUID) =>
  useQuery({ queryKey: qk.edgeNodes(branchId), queryFn: () => api.listEdgeNodes(branchId) });

// --- tariffs ---------------------------------------------------------------
export const useRatePlans = (branchId?: UUID) =>
  useQuery({ queryKey: qk.ratePlans(branchId), queryFn: () => api.listRatePlans(branchId) });

export function usePublishRatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RatePlanPublish) => api.publishRatePlan(body),
    onSuccess: (_d, body) => {
      void qc.invalidateQueries({ queryKey: ['rate-plans'] });
      void qc.invalidateQueries({ queryKey: qk.branchRatePlans(body.branch_id) });
    },
  });
}

// --- subscription plans ----------------------------------------------------
export const useSubscriptionPlans = (branchId?: UUID) =>
  useQuery({
    queryKey: qk.subscriptionPlans(branchId),
    queryFn: () => api.listSubscriptionPlans(branchId),
  });
export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubscriptionPlanCreate) => api.createSubscriptionPlan(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['subscription-plans'] }),
  });
}
export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: SubscriptionPlanUpdate }) =>
      api.updateSubscriptionPlan(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['subscription-plans'] }),
  });
}

// --- permits ---------------------------------------------------------------
export const usePermits = (f: PermitFilters) =>
  useQuery({ queryKey: qk.permits(f), queryFn: () => api.listPermits(f) });
export const usePermit = (id?: UUID) =>
  useQuery({ queryKey: qk.permit(id!), queryFn: () => api.getPermit(id!), enabled: enabled(id) });
export const usePermitPayments = (id?: UUID) =>
  useQuery({
    queryKey: qk.permitPayments(id!),
    queryFn: () => api.permitPayments(id!),
    enabled: enabled(id),
  });
export function useCreatePermit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PermitCreate) => api.createPermit(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['permits'] }),
  });
}

// --- visits (sessions) -----------------------------------------------------
export const useVisits = (f: VisitFilters) =>
  useQuery({ queryKey: qk.visits(f), queryFn: () => api.listVisits(f) });
export const useVisit = (id?: UUID) =>
  useQuery({ queryKey: qk.visit(id!), queryFn: () => api.getVisit(id!), enabled: enabled(id) });
export const useVisitPayments = (id?: UUID) =>
  useQuery({
    queryKey: qk.visitPayments(id!),
    queryFn: () => api.visitPayments(id!),
    enabled: enabled(id),
  });

// --- payments / charges ----------------------------------------------------
export const usePayments = (f: PaymentFilters) =>
  useQuery({ queryKey: qk.payments(f), queryFn: () => api.listPayments(f) });
export const useCharges = (f: ChargeFilters) =>
  useQuery({ queryKey: qk.charges(f), queryFn: () => api.listCharges(f) });

// --- lists -----------------------------------------------------------------
export const useListEntries = (kind?: ListKind, branchId?: UUID) =>
  useQuery({ queryKey: qk.lists(kind, branchId), queryFn: () => api.listListEntries(kind, branchId) });
export function useCreateListEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ListEntryCreate) => api.createListEntry(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}
export function useUpdateListEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: ListEntryUpdate }) => api.updateListEntry(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}
export function useDeleteListEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => api.deleteListEntry(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['lists'] }),
  });
}

// --- validation ------------------------------------------------------------
export const usePartnerOrgs = () =>
  useQuery({ queryKey: qk.partnerOrgs, queryFn: api.listPartnerOrgs });
export function useCreatePartnerOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PartnerOrgCreate) => api.createPartnerOrg(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.partnerOrgs }),
  });
}
export const useValidationPrograms = (branchId?: UUID) =>
  useQuery({
    queryKey: qk.validationPrograms(branchId),
    queryFn: () => api.listValidationPrograms(branchId),
  });
export const useValidationProgram = (id?: UUID) =>
  useQuery({
    queryKey: qk.validationProgram(id!),
    queryFn: () => api.getValidationProgram(id!),
    enabled: enabled(id),
  });
export const useValidationCodes = (id?: UUID) =>
  useQuery({
    queryKey: qk.validationCodes(id!),
    queryFn: () => api.listValidationCodes(id!),
    enabled: enabled(id),
  });
export const useRedemptions = (id?: UUID) =>
  useQuery({
    queryKey: qk.redemptions(id!),
    queryFn: () => api.listRedemptions(id!),
    enabled: enabled(id),
  });
export function useCreateValidationProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ValidationProgramCreate) => api.createValidationProgram(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['validation-programs'] }),
  });
}
export function useUpdateValidationProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: ValidationProgramUpdate }) =>
      api.updateValidationProgram(id, body),
    onSuccess: (_d, { id }) => {
      void qc.invalidateQueries({ queryKey: ['validation-programs'] });
      void qc.invalidateQueries({ queryKey: qk.validationProgram(id) });
    },
  });
}
export function useIssueValidationCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body?: ValidationCodeIssue }) =>
      api.issueValidationCode(id, body),
    onSuccess: (_d, { id }) => void qc.invalidateQueries({ queryKey: qk.validationCodes(id) }),
  });
}

// --- reporting -------------------------------------------------------------
export const useDashboard = (branchId?: UUID) =>
  useQuery({
    queryKey: qk.dashboard(branchId!),
    queryFn: () => api.dashboard(branchId!),
    enabled: enabled(branchId),
  });
export const useRevenueByDay = (branchId?: UUID, days = 30) =>
  useQuery({
    queryKey: qk.revenueByDay(branchId!, days),
    queryFn: () => api.revenueByDay(branchId!, days),
    enabled: enabled(branchId),
  });
export const useTopPlates = (branchId?: UUID, limit = 10) =>
  useQuery({
    queryKey: qk.topPlates(branchId!, limit),
    queryFn: () => api.topPlates(branchId!, limit),
    enabled: enabled(branchId),
  });
