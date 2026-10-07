/**
 * White/black list entries — LOCAL demo store (localStorage), so the redesigned
 * panel is fully interactive without the Management backend. Swaps to the real
 * `/lists` endpoints later (same async shape).
 */

export type ListKind = 'whitelist' | 'blacklist';

export interface ListEntry {
  id: string;
  kind: ListKind;
  plate: string;
  country: string;
  reason?: string;
  createdAt: string;
}

const KEY = 'ap.bp.lists.demo.v1';

function read(): ListEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as ListEntry[];
  } catch {
    return [];
  }
}
function write(rows: ListEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(rows));
}
function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `l-${Date.now().toString(36)}`;
}

function seed(): ListEntry[] {
  const existing = localStorage.getItem(KEY);
  if (existing) return read();
  const now = Date.now();
  const hrs = (h: number) => new Date(now - h * 3600_000).toISOString();
  const rows: ListEntry[] = [
    { id: uid(), kind: 'whitelist', plate: '01A001AA', country: 'uz', reason: 'Direktor', createdAt: hrs(50) },
    { id: uid(), kind: 'whitelist', plate: '01H070HH', country: 'uz', reason: 'Xizmat avtomobili', createdAt: hrs(20) },
    { id: uid(), kind: 'blacklist', plate: '01X999XX', country: 'uz', reason: 'Qarzdor', createdAt: hrs(30) },
    { id: uid(), kind: 'blacklist', plate: '85F111FF', country: 'uz', reason: 'Buzg‘unchi', createdAt: hrs(8) },
  ];
  write(rows);
  return rows;
}

const byNewest = (a: ListEntry, b: ListEntry) => b.createdAt.localeCompare(a.createdAt);

export const listsStore = {
  list(kind: ListKind): Promise<ListEntry[]> {
    return Promise.resolve(seed().filter((e) => e.kind === kind).sort(byNewest));
  },
  create(kind: ListKind, plate: string, country: string, reason?: string): Promise<ListEntry> {
    const rows = seed();
    const entry: ListEntry = {
      id: uid(),
      kind,
      plate: plate.toUpperCase().replace(/\s+/g, ''),
      country: country || 'uz',
      reason: reason?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    write([entry, ...rows]);
    return Promise.resolve(entry);
  },
  remove(id: string): Promise<void> {
    write(seed().filter((e) => e.id !== id));
    return Promise.resolve();
  },
};
