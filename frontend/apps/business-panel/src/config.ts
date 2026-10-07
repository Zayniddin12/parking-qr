/** Runtime config resolved from Vite env (see .env.example). */
export const config = {
  /** Management plane (Python/FastAPI) base URL, e.g. http://localhost:8000/v1 */
  managementApiUrl: import.meta.env.VITE_MANAGEMENT_API_URL,
  /** Core plane (Go) base URL, e.g. http://localhost:8080 */
  coreApiUrl: import.meta.env.VITE_CORE_API_URL,
  /** Standalone Partner Service base URL, e.g. http://localhost:8090.
   *  When unset, the Partners module uses its local demo store. */
  partnerApiUrl: import.meta.env.VITE_PARTNER_API_URL as string | undefined,
  /** Demo/kiosk mode: skip the OIDC gate (used by the Docker partner demo). */
  authDisabled: import.meta.env.VITE_AUTH_DISABLED === 'true',
} as const;
