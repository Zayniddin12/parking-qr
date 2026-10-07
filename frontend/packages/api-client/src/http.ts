import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from './types';
import { randomId } from './uuid';

/**
 * Axios wrapper for the AutoParking web panels — mirrors the legacy Vue
 * `useApi.ts` interceptor (DESIGN-ALIGNMENT §4):
 *   - Bearer access token on every request (from `getAccessToken`);
 *   - `Accept-Language` from the active locale (`getLocale`);
 *   - on 401 (except the refresh URL) → refresh once → retry; else logout;
 *   - `Idempotency-Key` on mutating calls to defeat double-send/replay.
 *
 * Spec §10.6 prefers an HttpOnly cookie for the real token (`withCredentials`);
 * `getAccessToken` covers deployments that still hold a bearer in memory. Both
 * are supported — provide whichever the environment uses.
 */
export interface ApiClientConfig {
  /** API base URL, e.g. https://api.autoparking.uz/v1 */
  baseUrl: string;
  /** Returns the current access token (memory/store). Optional if cookie-based. */
  getAccessToken?: () => string | undefined;
  /** Refresh the session; resolve `true` when a new token is available. */
  refreshToken?: () => Promise<boolean>;
  /** Called when auth cannot be recovered (redirect to login). */
  onUnauthorized?: () => void;
  /** Active locale → `Accept-Language`. */
  getLocale?: () => string | undefined;
  /** Non-secret tenant/branch scope hint header. */
  scopeHeader?: () => string | undefined;
  /** Send the HttpOnly session cookie (default true). */
  withCredentials?: boolean;
  /** Injectable axios instance (tests). */
  instance?: AxiosInstance;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError | undefined;
  constructor(status: number, body: ApiError | undefined) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Required on mutating core/payment calls to defeat double-send/replay. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

const REFRESH_PATH = '/auth/refresh';

export class HttpClient {
  private readonly axios: AxiosInstance;
  private readonly cfg: ApiClientConfig;
  private refreshing: Promise<boolean> | null = null;

  constructor(config: ApiClientConfig) {
    this.cfg = config;
    this.axios =
      config.instance ??
      axios.create({
        baseURL: (config.baseUrl ?? '').replace(/\/$/, ''),
        withCredentials: config.withCredentials ?? true,
        headers: { Accept: 'application/json' },
      });

    this.axios.interceptors.request.use((req) => {
      const token = config.getAccessToken?.();
      if (token) req.headers.set('Authorization', `Bearer ${token}`);
      const locale = config.getLocale?.();
      if (locale) req.headers.set('Accept-Language', locale);
      const scope = config.scopeHeader?.();
      if (scope) req.headers.set('X-Tenant-Scope', scope);
      return req;
    });

    this.axios.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;
        const status = error.response?.status;
        const isRefreshCall = original?.url?.includes(REFRESH_PATH);

        if (status === 401 && original && !original._retried && !isRefreshCall && config.refreshToken) {
          original._retried = true;
          const ok = await this.runRefresh();
          if (ok) return this.axios.request(original);
          config.onUnauthorized?.();
        } else if (status === 401 && !isRefreshCall) {
          config.onUnauthorized?.();
        }
        return Promise.reject(error);
      },
    );
  }

  /** Single-flight refresh: concurrent 401s share one refresh call. */
  private runRefresh(): Promise<boolean> {
    if (!this.cfg.refreshToken) return Promise.resolve(false);
    if (!this.refreshing) {
      this.refreshing = this.cfg
        .refreshToken()
        .catch(() => false)
        .finally(() => {
          this.refreshing = null;
        });
    }
    return this.refreshing;
  }

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    else if (method.toUpperCase() !== 'GET') headers['Idempotency-Key'] = randomId();

    try {
      const res = await this.axios.request<T>({
        method,
        url: path.startsWith('/') ? path : `/${path}`,
        params: opts.query,
        data: opts.body,
        headers,
        signal: opts.signal,
      });
      return res.data;
    } catch (err) {
      const ax = err as AxiosError<ApiError>;
      if (ax.response) throw new ApiRequestError(ax.response.status, ax.response.data);
      throw new ApiRequestError(0, { code: 'network_error', message: ax.message });
    }
  }

  get<T>(path: string, opts?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('GET', path, opts ?? {});
  }
  post<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, opts ?? {});
  }
  patch<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, opts ?? {});
  }
  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, opts ?? {});
  }
}
