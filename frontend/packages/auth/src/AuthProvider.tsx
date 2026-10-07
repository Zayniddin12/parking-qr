import { useEffect, type ReactNode } from 'react';
import {
  AuthProvider as OidcAuthProvider,
  useAuth,
  type AuthProviderProps as OidcAuthProviderProps,
} from 'react-oidc-context';
import { WebStorageStateStore, type User } from 'oidc-client-ts';
import { resolveOidcConfig, type OidcConfig } from './config';
import { setAccessToken } from './tokenStore';

export interface AuthProviderProps {
  children: ReactNode;
  /** Override any resolved OIDC field (defaults come from VITE_OIDC_* env). */
  config?: Partial<OidcConfig>;
}

/** Keeps the module-level token store in sync with the OIDC user (see tokenStore). */
function TokenSync(): null {
  const auth = useAuth();
  const token = auth.user?.access_token;
  useEffect(() => {
    setAccessToken(token);
  }, [token]);
  return null;
}

/**
 * Wraps the app in `react-oidc-context` configured for the AutoParking Keycloak
 * realm: Authorization Code + PKCE (S256 — the oidc-client-ts default for the
 * code flow), silent renew, and localStorage-backed session so a refresh keeps
 * the user signed in.
 *
 * On the OIDC callback we strip the `?code&state` query back off the URL so the
 * app lands on a clean route.
 */
export function AuthProvider({ children, config }: AuthProviderProps): JSX.Element {
  const cfg = resolveOidcConfig(config);

  const settings: OidcAuthProviderProps = {
    authority: cfg.authority,
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    post_logout_redirect_uri: cfg.postLogoutRedirectUri,
    scope: cfg.scope,
    response_type: 'code',
    automaticSilentRenew: true,
    // Persist the session across reloads; without this a refresh forces re-login.
    userStore:
      typeof window !== 'undefined'
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
    onSigninCallback: (_user: User | undefined): void => {
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    },
  };

  return (
    <OidcAuthProvider {...settings}>
      <TokenSync />
      {children}
    </OidcAuthProvider>
  );
}
