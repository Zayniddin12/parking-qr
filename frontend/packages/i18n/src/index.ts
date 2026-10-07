import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';
import { DynamicBackend, type DynamicBackendOptions } from './backend';

export const resources = {
  uz: { translation: uz },
  ru: { translation: ru },
  en: { translation: en },
} as const;

export type Locale = keyof typeof resources;
export const SUPPORTED_LOCALES: Locale[] = ['uz', 'ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'uz';

const COOKIE = 'ap_locale';

/** Read the persisted locale (cookie, like the Vue app), else the default. */
export function detectLocale(): Locale {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
    const found = match?.[1] as Locale | undefined;
    if (found && SUPPORTED_LOCALES.includes(found)) return found;
  }
  return DEFAULT_LOCALE;
}

/** Persist + switch the active locale (cookie, 1 year). */
export function setLocale(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
  }
  void i18n.changeLanguage(locale);
}

export interface InitI18nOptions {
  locale?: Locale;
  /** Enable the dynamic sessionStorage-cached backend (DESIGN-ALIGNMENT §4). */
  dynamic?: boolean;
  backend?: DynamicBackendOptions;
}

/**
 * Initialize the shared i18next instance (uz/ru/en). Bundled resources always
 * render offline; when `dynamic` is set, the DynamicBackend augments/overrides
 * them from `/locale-json/{locale}` and caches per session. Call once per app.
 */
export function initI18n(options: Locale | InitI18nOptions = DEFAULT_LOCALE) {
  const opts: InitI18nOptions = typeof options === 'string' ? { locale: options } : options;
  const locale = opts.locale ?? detectLocale();

  if (!i18n.isInitialized) {
    const chain = opts.dynamic ? i18n.use(new DynamicBackend()) : i18n;
    void chain.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      partialBundledLanguages: opts.dynamic,
      backend: opts.backend,
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

export { i18n };
export { DynamicBackend, createDynamicBackend } from './backend';
export type { DynamicBackendOptions } from './backend';
export { useTranslation, Trans, I18nextProvider } from 'react-i18next';
