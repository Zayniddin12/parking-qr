export { AuthProvider } from './AuthProvider';
export type { AuthProviderProps } from './AuthProvider';
export { RequireAuth } from './RequireAuth';
export type { RequireAuthProps } from './RequireAuth';
export { getAccessToken, setAccessToken } from './tokenStore';
export { resolveOidcConfig } from './config';
export type { OidcConfig } from './config';
export { useClaims, useCan } from './claims';
export type { AuthClaims } from './claims';

// Re-export the underlying hook so apps can drive sign-out / inspect status
// without a direct dependency on react-oidc-context.
export { useAuth } from 'react-oidc-context';
