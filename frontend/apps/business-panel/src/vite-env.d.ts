/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MANAGEMENT_API_URL: string;
  readonly VITE_CORE_API_URL: string;
  // OIDC / Keycloak (see @autoparking/auth). All optional — sane dev defaults.
  readonly VITE_OIDC_AUTHORITY?: string;
  readonly VITE_OIDC_CLIENT_ID?: string;
  readonly VITE_OIDC_REDIRECT_URI?: string;
  readonly VITE_OIDC_POST_LOGOUT_REDIRECT_URI?: string;
  readonly VITE_OIDC_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
