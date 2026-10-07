/**
 * Module-level access-token holder.
 *
 * `react-oidc-context` keeps the token inside React context, but non-React
 * callers — the axios interceptor in `@autoparking/api-client` and the
 * fetch-based SSE reader in `@autoparking/realtime` — need a plain synchronous
 * getter. `<AuthProvider>` keeps this store in sync with the OIDC user, so
 * `getAccessToken()` always returns the freshest bearer without prop-drilling.
 */

let currentToken: string | undefined;

export function setAccessToken(token: string | undefined): void {
  currentToken = token;
}

/** Current OIDC access token (Bearer), or undefined when logged out. */
export function getAccessToken(): string | undefined {
  return currentToken;
}
