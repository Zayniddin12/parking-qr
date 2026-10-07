export { HttpClient, ApiRequestError } from './http';
export type { ApiClientConfig, RequestOptions } from './http';
export { ManagementApi, CoreApi } from './endpoints';
export { randomId } from './uuid';
export * from './types';

import { HttpClient, type ApiClientConfig } from './http';
import { ManagementApi, CoreApi } from './endpoints';

export interface AutoParkingClients {
  management: ManagementApi;
  core: CoreApi;
}

/** Auth/i18n wiring shared by both planes (Bearer + refresh + Accept-Language). */
export type SharedClientOptions = Pick<
  ApiClientConfig,
  'getAccessToken' | 'refreshToken' | 'onUnauthorized' | 'getLocale' | 'scopeHeader' | 'withCredentials'
>;

/**
 * Build the client pair from env-provided base URLs.
 *
 *   VITE_MANAGEMENT_API_URL → Python/FastAPI management plane (CRUD/reporting).
 *   VITE_CORE_API_URL       → Go core plane (payments, governance).
 *
 * The panels default to the management client; the attendant/kiosk apps also
 * hold a core client for charges + barrier overrides. Auth (Bearer + 401
 * refresh) and `Accept-Language` are shared across both planes.
 */
export function createClients(config: {
  managementBaseUrl: string;
  coreBaseUrl: string;
} & SharedClientOptions): AutoParkingClients {
  const { managementBaseUrl, coreBaseUrl, ...shared } = config;
  return {
    management: new ManagementApi(new HttpClient({ baseUrl: managementBaseUrl, ...shared })),
    core: new CoreApi(new HttpClient({ baseUrl: coreBaseUrl, ...shared })),
  };
}
