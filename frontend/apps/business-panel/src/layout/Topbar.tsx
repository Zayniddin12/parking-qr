import { useTranslation, setLocale, type Locale } from '@autoparking/i18n';

const LANGS: Locale[] = ['uz', 'ru', 'en'];

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { i18n } = useTranslation();
  const active = i18n.language;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/85 px-6 py-3.5 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-2xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1 rounded-2lg bg-gray-100 p-0.5">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={
              'rounded-[8px] px-2.5 py-1 text-2xs font-semibold uppercase transition-colors ' +
              (active === l ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700')
            }
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  );
}
