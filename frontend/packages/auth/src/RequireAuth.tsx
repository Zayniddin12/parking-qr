import { useEffect, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';

export interface RequireAuthProps {
  children: ReactNode;
  /** Rendered while redirecting / loading the session. */
  fallback?: ReactNode;
}

function DefaultFallback({ message }: { message: string }): JSX.Element {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#6b7280',
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

/**
 * Route gate: on load, an unauthenticated user is redirected to the Keycloak
 * login page (Authorization Code + PKCE). While the session is loading or the
 * browser is mid-redirect we show a fallback; children render only once a valid
 * session exists. Fail-closed — nothing protected renders without auth.
 */
export function RequireAuth({ children, fallback }: RequireAuthProps): JSX.Element {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading && !auth.activeNavigator && !auth.error) {
      void auth.signinRedirect();
    }
  }, [auth, auth.isAuthenticated, auth.isLoading, auth.activeNavigator, auth.error]);

  if (auth.error) {
    return (
      <DefaultFallback message={`Sign-in failed: ${auth.error.message}. Retrying…`} />
    );
  }

  if (!auth.isAuthenticated) {
    return <>{fallback ?? <DefaultFallback message="Redirecting to sign in…" />}</>;
  }

  return <>{children}</>;
}
