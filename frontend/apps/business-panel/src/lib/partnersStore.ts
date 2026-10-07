/**
 * Partner accounts + issued validation checks — LOCAL demo store.
 *
 * The Partner module (name/logo/email/password) and its issued QR checks are a
 * new product surface whose Management endpoints are not wired yet. To let the
 * Business Panel ship and be demoed against the imminent new-lot opening, the
 * data lives in `localStorage` behind the SAME async shape the real API will
 * expose — every call returns a Promise and the React-Query hooks in
 * `partnerHooks.ts` invalidate exactly as they will against HTTP.
 *
 * TODO(management): fold the standalone Partner Service into FastAPI Management.
 * The hook layer, pages and types stay unchanged.
 */
import { apiPartnersStore, PARTNER_API } from './partnerApi';

export interface PartnerTariff {
  /** Free parking minutes granted to a car whose plate the partner validates. */
  freeMinutes: number;
  note?: string;
}

export interface Partner {
  id: string;
  name: string;
  /** Short human code embedded (encrypted) into every QR, e.g. "BKF-1". */
  key: string;
  email: string;
  /** Demo-only. The real backend never returns a password; credentials are set
   *  write-only and verified server-side. */
  password: string;
  /** Data-URL logo (uploaded in the create/edit modal). */
  logoUrl?: string;
  active: boolean;
  createdAt: string;
  tariff: PartnerTariff;
}

export interface IssuedCheck {
  id: string;
  partnerId: string;
  plate: string;
  /** Opaque unique token encoded into the QR on the partner landing receipt. */
  code: string;
  createdAt: string;
}

export interface PartnerCreate {
  name: string;
  key: string;
  email: string;
  password: string;
  logoUrl?: string;
  tariff?: Partial<PartnerTariff>;
}

export interface PartnerUpdate {
  name?: string;
  key?: string;
  email?: string;
  password?: string;
  logoUrl?: string;
  active?: boolean;
  tariff?: Partial<PartnerTariff>;
}

const PARTNERS_KEY = 'ap.bp.partners.v1';
const CHECKS_KEY = 'ap.bp.checks.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.abs(hashStr(String(performance.now()))).toString(36)}`;
}

/** Short, human-friendly check id, e.g. `AP-7F3K9Q`. */
function checkId(seed: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let n = Math.abs(hashStr(String(seed) + uid()));
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet.charAt(n % alphabet.length);
    n = Math.floor(n / alphabet.length) + 7;
  }
  return `AP-${out}`;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

// --- seed ------------------------------------------------------------------
function seedIfEmpty(): void {
  if (localStorage.getItem(PARTNERS_KEY)) return;
  const now = Date.now();
  const hrs = (h: number) => new Date(now - h * 3600_000).toISOString();

  const partners: Partner[] = [
    {
      id: 'p-mega',
      name: 'MEGA Planet',
      key: 'MEGA-1',
      email: 'mega@partners.autoparking.uz',
      password: 'mega12345',
      active: true,
      createdAt: hrs(72),
      tariff: { freeMinutes: 180, note: 'Xaridorlar uchun 3 soat bepul' },
    },
    {
      id: 'p-chinar',
      name: 'Chinor Cafe',
      key: 'CHN-1',
      email: 'chinor@partners.autoparking.uz',
      password: 'chinor123',
      active: true,
      createdAt: hrs(40),
      tariff: { freeMinutes: 120, note: 'Mehmonlar uchun 2 soat' },
    },
  ];

  const plates = ['01A001AA', '01B234BC', '30A777AA', '01M555MM', '01Z010ZZ', '95K321KA'];
  const checks: IssuedCheck[] = [];
  let s = 1;
  for (const p of partners) {
    const count = p.id === 'p-mega' ? 5 : 3;
    for (let i = 0; i < count; i++) {
      checks.push({
        id: checkId(s++),
        partnerId: p.id,
        plate: plates[(s + i) % plates.length]!,
        code: uid(),
        createdAt: hrs(i * 9 + (p.id === 'p-mega' ? 2 : 6)),
      });
    }
  }

  write(PARTNERS_KEY, partners);
  write(CHECKS_KEY, checks);
}

function allPartners(): Partner[] {
  seedIfEmpty();
  return read<Partner[]>(PARTNERS_KEY, []);
}
function allChecks(): IssuedCheck[] {
  seedIfEmpty();
  return read<IssuedCheck[]>(CHECKS_KEY, []);
}

const byNewest = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);

// --- public (Promise) API --------------------------------------------------

const localPartnersStore = {
  list(): Promise<Partner[]> {
    return Promise.resolve([...allPartners()].sort(byNewest));
  },

  get(id: string): Promise<Partner> {
    const p = allPartners().find((x) => x.id === id);
    if (!p) return Promise.reject(new Error('Partner topilmadi'));
    return Promise.resolve(p);
  },

  create(body: PartnerCreate): Promise<Partner> {
    const partners = allPartners();
    const partner: Partner = {
      id: uid(),
      name: body.name.trim(),
      key: body.key.trim().toUpperCase(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      logoUrl: body.logoUrl,
      active: true,
      createdAt: new Date().toISOString(),
      tariff: { freeMinutes: body.tariff?.freeMinutes ?? 120, note: body.tariff?.note },
    };
    write(PARTNERS_KEY, [partner, ...partners]);
    return Promise.resolve(partner);
  },

  update(id: string, body: PartnerUpdate): Promise<Partner> {
    const partners = allPartners();
    const idx = partners.findIndex((x) => x.id === id);
    const prev = partners[idx];
    if (!prev) return Promise.reject(new Error('Partner topilmadi'));
    const next: Partner = {
      ...prev,
      name: body.name?.trim() ?? prev.name,
      key: body.key?.trim().toUpperCase() ?? prev.key,
      email: body.email?.trim().toLowerCase() ?? prev.email,
      password: body.password && body.password.length > 0 ? body.password : prev.password,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : prev.logoUrl,
      active: body.active ?? prev.active,
      tariff: {
        freeMinutes: body.tariff?.freeMinutes ?? prev.tariff.freeMinutes,
        note: body.tariff?.note !== undefined ? body.tariff.note : prev.tariff.note,
      },
    };
    partners[idx] = next;
    write(PARTNERS_KEY, partners);
    return Promise.resolve(next);
  },

  remove(id: string): Promise<void> {
    write(PARTNERS_KEY, allPartners().filter((x) => x.id !== id));
    write(CHECKS_KEY, allChecks().filter((c) => c.partnerId !== id));
    return Promise.resolve();
  },

  checks(partnerId: string): Promise<IssuedCheck[]> {
    return Promise.resolve(allChecks().filter((c) => c.partnerId === partnerId).sort(byNewest));
  },
};

// Use the standalone Partner Service when configured; otherwise the local demo.
export const partnersStore = PARTNER_API ? apiPartnersStore : localPartnersStore;
