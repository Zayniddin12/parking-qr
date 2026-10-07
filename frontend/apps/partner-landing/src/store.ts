/**
 * Partner-landing data layer.
 *
 * When `VITE_PARTNER_API_URL` is set it talks to the standalone Partner Service
 * (FastAPI); otherwise it falls back to a `localStorage` demo store so the app
 * still runs fully offline. Both paths expose the same async surface, so the UI
 * is source-agnostic.
 */

export interface PartnerAccount {
  id: string;
  name: string;
  email: string;
  logoUrl?: string | null;
  freeMinutes: number;
  note?: string | null;
  active?: boolean;
}

export interface Check {
  id: string;
  /** Optional — partners no longer enter a plate; kept for backward-compat. */
  plate?: string | null;
  /** Opaque unique token encoded into the QR. */
  code: string;
  createdAt: string;
}

const API = import.meta.env.VITE_PARTNER_API_URL as string | undefined;

const SESSION_KEY = 'ap.pl.session.v1';
const TOKEN_KEY = 'ap.pl.token.v1';
const CHECKS_KEY = 'ap.pl.checks.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.floor(performance.now())}`;
}

// =========================================================================
// API-backed implementation
// =========================================================================
function token(): string | null {
  return read<string | null>(TOKEN_KEY, null);
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const t = token();
  if (t) headers.authorization = `Bearer ${t}`;
  return fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
}

// =========================================================================
// localStorage demo implementation
// =========================================================================
const DEMO_ACCOUNTS: (PartnerAccount & { password: string })[] = [
  {
    id: 'p-mega',
    name: 'MEGA Planet',
    email: 'mega@partners.autoparking.uz',
    password: 'mega12345',
    freeMinutes: 180,
    note: 'Xaridorlar uchun 3 soat bepul turargoh',
  },
  {
    id: 'p-chinor',
    name: 'Chinor Cafe',
    email: 'chinor@partners.autoparking.uz',
    password: 'chinor123',
    freeMinutes: 120,
    note: 'Mehmonlar uchun 2 soat bepul',
  },
];

function checkId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const src = uid().replace(/-/g, '');
  for (let i = 0; i < 6; i++) {
    const n = parseInt(src.charAt(i) || '0', 16);
    out += alphabet.charAt((n * 7 + i * 5) % alphabet.length);
  }
  return `AP-${out}`;
}

type ChecksByPartner = Record<string, Check[]>;

function seedChecksIfEmpty(): void {
  if (localStorage.getItem(CHECKS_KEY)) return;
  const now = Date.now();
  const hrs = (h: number) => new Date(now - h * 3600_000).toISOString();
  const map: ChecksByPartner = {
    'p-mega': [
      { id: 'AP-7F3K9Q', plate: '01A001AA', code: uid(), createdAt: hrs(3) },
      { id: 'AP-M22XPL', plate: '01B234BC', code: uid(), createdAt: hrs(11) },
      { id: 'AP-Q9WZ4T', plate: '30A777AA', code: uid(), createdAt: hrs(28) },
    ],
    'p-chinor': [{ id: 'AP-KK80RN', plate: '01M555MM', code: uid(), createdAt: hrs(5) }],
  };
  writeLS(CHECKS_KEY, map);
}

const byNewest = (a: Check, b: Check) => b.createdAt.localeCompare(a.createdAt);

// =========================================================================
// Public async surface
// =========================================================================
export const store = {
  async login(email: string, password: string): Promise<PartnerAccount | null> {
    if (API) {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { token: string; partner: PartnerAccount };
      writeLS(TOKEN_KEY, data.token);
      writeLS(SESSION_KEY, data.partner);
      return data.partner;
    }
    const acc = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!acc) return null;
    const partner: PartnerAccount = {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      logoUrl: acc.logoUrl,
      freeMinutes: acc.freeMinutes,
      note: acc.note,
    };
    writeLS(SESSION_KEY, partner);
    return partner;
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  current(): PartnerAccount | null {
    return read<PartnerAccount | null>(SESSION_KEY, null);
  },

  async listChecks(partnerId: string): Promise<Check[]> {
    if (API) {
      const res = await apiFetch('/checks');
      if (!res.ok) return [];
      return (await res.json()) as Check[];
    }
    seedChecksIfEmpty();
    const map = read<ChecksByPartner>(CHECKS_KEY, {});
    return [...(map[partnerId] ?? [])].sort(byNewest);
  },

  async issueCheck(partnerId: string): Promise<Check> {
    if (API) {
      const res = await apiFetch('/checks', { method: 'POST', body: '{}' });
      if (!res.ok) throw new Error('Chek yaratilmadi');
      return (await res.json()) as Check;
    }
    seedChecksIfEmpty();
    const map = read<ChecksByPartner>(CHECKS_KEY, {});
    const check: Check = {
      id: checkId(),
      code: uid(),
      createdAt: new Date().toISOString(),
    };
    map[partnerId] = [check, ...(map[partnerId] ?? [])];
    writeLS(CHECKS_KEY, map);
    return check;
  },
};

/**
 * QR payload = the check `code` verbatim. In backend mode that's the encrypted
 * token `base64(iv || AES-CBC(secret, "<KEY>: <micros>"))` which reader devices
 * decrypt offline with the shared secret. In offline demo mode it's a random id.
 */
export function qrPayload(check: Check): string {
  return check.code;
}
