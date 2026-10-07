import type { HttpClient } from './http';
import type {
  BarrierOverrideRequest,
  Branch,
  Charge,
  CreateChargeRequest,
  Device,
  ListEntry,
  ListKind,
  ManualOverride,
  Organization,
  Permit,
  RatePlan,
  RevenueReport,
  UUID,
  ValidationCode,
  ValidationProgram,
} from './types';

/**
 * Endpoint surface consumed by the web panels. Operation names and paths mirror
 * contracts/openapi.yaml. Everything here targets the MANAGEMENT plane except
 * `barrierOverride` / `createCharge`, which are CORE governance/payment calls
 * the attendant panel dispatches directly (documented per-method).
 */
export class ManagementApi {
  constructor(private readonly http: HttpClient) {}

  // --- management:tenancy ---
  listOrganizations(): Promise<Organization[]> {
    return this.http.get('/orgs');
  }
  listBranches(): Promise<Branch[]> {
    return this.http.get('/branches');
  }
  createBranch(branch: Branch): Promise<Branch> {
    return this.http.post('/branches', { body: branch });
  }

  // --- management:fleet ---
  listDevices(branchId?: UUID): Promise<Device[]> {
    return this.http.get('/devices', { query: { branch_id: branchId } });
  }

  // --- management:tariffs ---
  publishRatePlan(plan: RatePlan): Promise<RatePlan> {
    return this.http.post('/rate-plans', { body: plan });
  }

  // --- management:parking ---
  createPermit(permit: Permit): Promise<Permit> {
    return this.http.post('/permits', { body: permit });
  }

  // --- management:validation ---
  createValidationProgram(program: ValidationProgram): Promise<ValidationProgram> {
    return this.http.post('/validation-programs', { body: program });
  }
  issueValidationCode(programId: UUID): Promise<ValidationCode> {
    return this.http.post(`/validation-programs/${programId}/codes`);
  }

  // --- management:lists ---
  listListEntries(kind?: ListKind): Promise<ListEntry[]> {
    return this.http.get('/lists', { query: { kind } });
  }
  createListEntry(entry: ListEntry): Promise<ListEntry> {
    return this.http.post('/lists', { body: entry });
  }

  // --- management:reporting ---
  revenueReport(branchId: UUID, from?: string, to?: string): Promise<RevenueReport> {
    return this.http.get('/reports/revenue', { query: { branchId, from, to } });
  }
}

/**
 * The small slice of CORE (Go) endpoints the attendant/kiosk panels call
 * directly. Kept separate so the boundary stays visible: edges talk only to
 * core, but these two operator/self-service actions also originate a core call.
 */
export class CoreApi {
  constructor(private readonly http: HttpClient) {}

  /** core:payments — self-service / attendant-initiated charge. */
  createCharge(req: CreateChargeRequest, idempotencyKey: string): Promise<Charge> {
    return this.http.post('/charges', { body: req, idempotencyKey });
  }

  /** core:governance — force-majeure barrier override (reason-coded, audited). */
  barrierOverride(
    pocId: UUID,
    req: BarrierOverrideRequest,
    idempotencyKey: string,
  ): Promise<ManualOverride> {
    return this.http.post(`/barriers/${pocId}/override`, { body: req, idempotencyKey });
  }
}
