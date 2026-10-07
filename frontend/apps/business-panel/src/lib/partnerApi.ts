/**
 * Partner store backed by the standalone Partner Service (FastAPI).
 *
 * Implements the same interface as the local `partnersStore` demo, mapping the
 * backend's flat DTO (freeMinutes/note) to the app's `tariff` shape so pages and
 * hooks are unchanged. Selected over the local store when `VITE_PARTNER_API_URL`
 * is configured (see `partnersStore.ts`).
 */
import { config } from '../config';
import type {
  IssuedCheck,
  Partner,
  PartnerCreate,
  PartnerUpdate,
} from './partnersStore';

export const PARTNER_API = config.partnerApiUrl;

interface PartnerDto {
  id: string;
  name: string;
  key: string;
  email: string;
  logoUrl: string | null;
  freeMinutes: number;
  note: string | null;
  active: boolean;
  createdAt: string;
}

function partnerFromDto(d: PartnerDto): Partner {
  return {
    id: d.id,
    name: d.name,
    key: d.key,
    email: d.email,
    password: '',
    logoUrl: d.logoUrl ?? undefined,
    active: d.active,
    createdAt: d.createdAt,
    tariff: { freeMinutes: d.freeMinutes, note: d.note ?? undefined },
  };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PARTNER_API}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // non-JSON error body
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export const apiPartnersStore = {
  async list(): Promise<Partner[]> {
    const rows = await req<PartnerDto[]>('/partners');
    return rows.map(partnerFromDto);
  },

  async get(id: string): Promise<Partner> {
    return partnerFromDto(await req<PartnerDto>(`/partners/${id}`));
  },

  async create(body: PartnerCreate): Promise<Partner> {
    const dto = await req<PartnerDto>('/partners', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        key: body.key,
        email: body.email,
        password: body.password,
        logoUrl: body.logoUrl,
        freeMinutes: body.tariff?.freeMinutes ?? 120,
        note: body.tariff?.note,
      }),
    });
    return partnerFromDto(dto);
  },

  async update(id: string, body: PartnerUpdate): Promise<Partner> {
    const dto = await req<PartnerDto>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: body.name,
        key: body.key,
        email: body.email,
        password: body.password || undefined,
        logoUrl: body.logoUrl,
        active: body.active,
        freeMinutes: body.tariff?.freeMinutes,
        note: body.tariff?.note,
      }),
    });
    return partnerFromDto(dto);
  },

  async remove(id: string): Promise<void> {
    await req<{ ok: boolean }>(`/partners/${id}`, { method: 'DELETE' });
  },

  async checks(partnerId: string): Promise<IssuedCheck[]> {
    return req<IssuedCheck[]>(`/partners/${partnerId}/checks`);
  },
};
