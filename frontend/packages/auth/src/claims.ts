import { useAuth } from 'react-oidc-context';

/**
 * AutoParking-specific claims injected by the Keycloak protocol mappers on the
 * `autoparking-web` client (phase-1 auth contract): the tenant, the flattened
 * realm roles, and the branch scope. Read from the ID/access-token profile.
 */
export interface AuthClaims {
  sub?: string;
  email?: string;
  name?: string;
  tenantId?: string;
  roles: string[];
  branches: string[];
}

type ProfileBag = Record<string, unknown> & {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  tenant_id?: string;
  roles?: unknown;
  branches?: unknown;
};

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string' && v.length > 0) return [v];
  return [];
}

/** Hook: the decoded AutoParking claims for the signed-in user. */
export function useClaims(): AuthClaims {
  const auth = useAuth();
  const profile = (auth.user?.profile ?? {}) as ProfileBag;
  return {
    sub: profile.sub,
    email: profile.email,
    name: profile.name ?? profile.preferred_username,
    tenantId: typeof profile.tenant_id === 'string' ? profile.tenant_id : undefined,
    roles: asStringArray(profile.roles),
    branches: asStringArray(profile.branches),
  };
}

/** Hook: a permission predicate. A user with the `owner` role can do anything. */
export function useCan(): (permission?: string) => boolean {
  const { roles } = useClaims();
  return (_permission?: string): boolean => {
    // Coarse RBAC for the panels: owners/admins see every module. Fine-grained
    // permission checks are enforced server-side (fail-closed) regardless.
    return roles.includes('owner') || roles.includes('business_admin');
  };
}
