/**
 * OIDC configuration for the AutoParking web surfaces, resolved from Vite env.
 *
 * The values default to the local Keycloak dev realm from the phase-1 auth
 * contract, but every field is overridable via `VITE_OIDC_*` so the same build
 * points at staging/prod Keycloak without code changes.
 *
 *   VITE_OIDC_AUTHORITY   → Keycloak issuer (realm base URL)
 *   VITE_OIDC_CLIENT_ID   → the public SPA client (PKCE S256)
 *   VITE_OIDC_REDIRECT_URI, VITE_OIDC_POST_LOGOUT_REDIRECT_URI, VITE_OIDC_SCOPE
 *
 * `import.meta.env` is read defensively (cast) so this file type-checks on its
 * own without pulling in Vite's ambient client types.
 */

interface ViteEnvBag {
  [key: string]: string | boolean | undefined;
}

function viteEnv(): ViteEnvBag {
  return (import.meta as unknown as { env?: ViteEnvBag }).env ?? {};
}

export interface OidcConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scope: string;
}

/** Local Keycloak dev realm (phase-1 auth contract). */
const DEFAULTS = {
  authority: 'http://localhost:8081/realms/autoparking',
  clientId: 'autoparking-web',
  scope: 'openid profile email',
} as const;

export function resolveOidcConfig(overrides: Partial<OidcConfig> = {}): OidcConfig {
  const env = viteEnv();
  const origin =
    typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:5173';
  const str = (v: string | boolean | undefined): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;

  return {
    authority: overrides.authority ?? str(env.VITE_OIDC_AUTHORITY) ?? DEFAULTS.authority,
    clientId: overrides.clientId ?? str(env.VITE_OIDC_CLIENT_ID) ?? DEFAULTS.clientId,
    redirectUri: overrides.redirectUri ?? str(env.VITE_OIDC_REDIRECT_URI) ?? `${origin}/`,
    postLogoutRedirectUri:
      overrides.postLogoutRedirectUri ?? str(env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI) ?? `${origin}/`,
    scope: overrides.scope ?? str(env.VITE_OIDC_SCOPE) ?? DEFAULTS.scope,
  };
}
