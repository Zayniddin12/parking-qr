/** Tariff plans — LOCAL demo store (localStorage). Money in tiyin. */

export interface TariffPlan {
  id: string;
  name: string;
  hourlyTiyin: number;
  freeMinutes: number;
  dailyCapTiyin: number;
  active: boolean;
  createdAt: string;
}

const KEY = 'ap.bp.tariffs.demo.v1';

function read(): TariffPlan[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as TariffPlan[];
  } catch {
    return [];
  }
}
function write(rows: TariffPlan[]): void {
  localStorage.setItem(KEY, JSON.stringify(rows));
}
function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t-${Date.now().toString(36)}`;
}

function seed(): TariffPlan[] {
  const existing = localStorage.getItem(KEY);
  if (existing) return read();
  const now = new Date().toISOString();
  const rows: TariffPlan[] = [
    { id: uid(), name: 'Standart', hourlyTiyin: 500000, freeMinutes: 15, dailyCapTiyin: 5000000, active: true, createdAt: now },
    { id: uid(), name: 'Kechki', hourlyTiyin: 300000, freeMinutes: 30, dailyCapTiyin: 3000000, active: true, createdAt: now },
  ];
  write(rows);
  return rows;
}

export const tariffStore = {
  list(): Promise<TariffPlan[]> {
    return Promise.resolve(seed());
  },
  create(v: Omit<TariffPlan, 'id' | 'createdAt' | 'active'>): Promise<TariffPlan> {
    const plan: TariffPlan = { ...v, id: uid(), active: true, createdAt: new Date().toISOString() };
    write([...seed(), plan]);
    return Promise.resolve(plan);
  },
  remove(id: string): Promise<void> {
    write(seed().filter((p) => p.id !== id));
    return Promise.resolve();
  },
};
