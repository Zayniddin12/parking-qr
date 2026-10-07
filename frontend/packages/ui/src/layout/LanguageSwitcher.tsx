import { useState } from 'react';
import { cn } from '../lib/cn';

export type LangCode = 'uz' | 'ru' | 'en';

export interface LanguageSwitcherProps {
  value: LangCode;
  onChange: (lang: LangCode) => void;
  className?: string;
}

const LANGS: { code: LangCode; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

/** uz/ru/en switcher (persists via the onChange handler, e.g. cookie). */
export function LanguageSwitcher({ value, onChange, className }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === value) ?? LANGS[0]!;

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-2lg border border-gray-200 bg-white px-2.5 py-1.5 text-2xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="uppercase">{current.code}</span>
        <span aria-hidden="true" className="text-gray-400">
          ▾
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-2lg border border-gray-200 bg-white py-1 shadow-card"
          >
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === value}
                  onClick={() => {
                    onChange(l.code);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-2xs transition-colors hover:bg-gray-100',
                    l.code === value ? 'font-semibold text-primary' : 'text-gray-600',
                  )}
                >
                  <span aria-hidden="true">{l.flag}</span>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
