/**
 * Organizations the signed-in business owns — LOCAL demo store.
 *
 * Drives the sidebar org-switcher. A business may have several organizations;
 * with one, the switcher offers "add company" → leave a request (zayavka).
 * Persisted in localStorage until the real tenancy endpoints are wired.
 */

export interface Org {
  id: string;
  name: string;
  logoUrl?: string;
  /** true = live org; false = pending request (zayavka). */
  active: boolean;
}

export interface CompanyRequest {
  id: string;
  name: string;
  contact: string;
  createdAt: string;
}

const ORGS_KEY = 'ap.bp.orgs.v1';
const CURRENT_KEY = 'ap.bp.currentOrg.v1';
const REQ_KEY = 'ap.bp.companyRequests.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, v: T): void {
  localStorage.setItem(key, JSON.stringify(v));
}
function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `org-${Date.now().toString(36)}`;
}

function seed(): Org[] {
  const existing = read<Org[] | null>(ORGS_KEY, null);
  if (existing && existing.length) return existing;
  const orgs: Org[] = [{ id: 'org-mega', name: 'MEGA Group', active: true }];
  write(ORGS_KEY, orgs);
  return orgs;
}

export const orgsStore = {
  list(): Org[] {
    return seed();
  },

  current(): Org {
    const orgs = seed();
    const id = read<string | null>(CURRENT_KEY, null);
    return orgs.find((o) => o.id === id) ?? orgs[0]!;
  },

  setCurrent(id: string): void {
    write(CURRENT_KEY, id);
  },

  /** Leave a request to add a new company (creates a pending org). */
  requestCompany(name: string, contact: string): CompanyRequest {
    const reqs = read<CompanyRequest[]>(REQ_KEY, []);
    const req: CompanyRequest = {
      id: uid(),
      name: name.trim(),
      contact: contact.trim(),
      createdAt: new Date().toISOString(),
    };
    write(REQ_KEY, [req, ...reqs]);
    return req;
  },

  requests(): CompanyRequest[] {
    return read<CompanyRequest[]>(REQ_KEY, []);
  },
};
