import type { BackendModule, ReadCallback, Services, InitOptions } from 'i18next';

export interface DynamicBackendOptions {
  /** URL template; `{{lng}}` and `{{ns}}` are substituted. Mirrors the legacy
   *  Vue loader `/locale-json/{locale}`. */
  loadPath?: string;
  /** sessionStorage cache (like the Vue app). Set false to disable. */
  cache?: boolean;
  /** Cache key prefix. */
  cachePrefix?: string;
}

const DEFAULTS: Required<DynamicBackendOptions> = {
  loadPath: '/locale-json/{{lng}}.json',
  cache: true,
  cachePrefix: 'ap-i18n:',
};

/**
 * react-i18next dynamic backend replicating the owner's Vue loader
 * (DESIGN-ALIGNMENT §4): fetches `/locale-json/{locale}` on demand and caches
 * the payload in sessionStorage, so a locale is fetched once per session.
 */
export class DynamicBackend implements BackendModule<DynamicBackendOptions> {
  readonly type = 'backend' as const;
  private options: Required<DynamicBackendOptions> = DEFAULTS;

  init(_services: Services, backendOptions: DynamicBackendOptions = {}, _i18nextOptions: InitOptions = {}): void {
    this.options = { ...DEFAULTS, ...backendOptions };
  }

  read(language: string, namespace: string, callback: ReadCallback): void {
    const url = this.options.loadPath
      .replace('{{lng}}', encodeURIComponent(language))
      .replace('{{ns}}', encodeURIComponent(namespace));
    const cacheKey = `${this.options.cachePrefix}${language}:${namespace}`;

    if (this.options.cache) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          callback(null, JSON.parse(cached));
          return;
        }
      } catch {
        // sessionStorage unavailable (private mode / SSR) — fall through to fetch.
      }
    }

    fetch(url, { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error(`i18n load failed: ${res.status}`);
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        if (this.options.cache) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } catch {
            // ignore quota/availability errors
          }
        }
        callback(null, data);
      })
      .catch((err: Error) => {
        // Non-fatal: bundled fallback resources still render the UI.
        callback(err, false);
      });
  }
}

export function createDynamicBackend(options?: DynamicBackendOptions): DynamicBackend {
  const backend = new DynamicBackend();
  backend.init({} as Services, options ?? {});
  return backend;
}
