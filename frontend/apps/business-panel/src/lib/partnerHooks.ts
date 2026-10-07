/**
 * React-Query hooks over the Partner store. Same shape as `lib/hooks.ts` so the
 * pages read identically once the store is swapped for real HTTP endpoints.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnersStore, type PartnerCreate, type PartnerUpdate } from './partnersStore';

export const pqk = {
  partners: ['partners'] as const,
  partner: (id: string) => ['partners', id] as const,
  checks: (id: string) => ['partners', id, 'checks'] as const,
};

export const usePartners = () =>
  useQuery({ queryKey: pqk.partners, queryFn: () => partnersStore.list() });

export const usePartner = (id?: string) =>
  useQuery({
    queryKey: pqk.partner(id ?? ''),
    queryFn: () => partnersStore.get(id!),
    enabled: !!id,
  });

export const usePartnerChecks = (id?: string) =>
  useQuery({
    queryKey: pqk.checks(id ?? ''),
    queryFn: () => partnersStore.checks(id!),
    enabled: !!id,
  });

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PartnerCreate) => partnersStore.create(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: pqk.partners }),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PartnerUpdate }) =>
      partnersStore.update(id, body),
    onSuccess: (_d, { id }) => {
      void qc.invalidateQueries({ queryKey: pqk.partners });
      void qc.invalidateQueries({ queryKey: pqk.partner(id) });
    },
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnersStore.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: pqk.partners }),
  });
}
