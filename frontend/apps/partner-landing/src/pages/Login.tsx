import { useState } from 'react';
import { store, type PartnerAccount } from '../store';
import { Wordmark } from '../components/Wordmark';

export function Login({ onLogin }: { onLogin: (a: PartnerAccount) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const acc = await store.login(email, password);
      if (acc) onLogin(acc);
      else setError('Email yoki parol noto‘g‘ri');
    } catch {
      setError('Serverga ulanib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Wordmark />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Hamkor kabineti</h1>
            <p className="mt-1 text-2xs text-gray-500">Mijozlaringiz uchun QR chek chiqaring</p>
          </div>
        </div>

        <form
          onSubmit={(e) => void submit(e)}
          className="flex flex-col gap-4 rounded-2lg border border-gray-200 bg-white/90 p-6 shadow-auth backdrop-blur"
        >
          <Field
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={setEmail}
            placeholder="hamkor@autoparking.uz"
          />
          <Field
            label="Parol"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {error && (
            <div className="rounded-2lg border border-red-200 bg-red-50 px-3 py-2 text-2xs text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="focus-ring mt-1 inline-flex h-11 items-center justify-center rounded-2lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
          >
            {busy ? 'Kirilmoqda…' : 'Kirish'}
          </button>
        </form>

        <div className="mt-5 rounded-2lg border border-dashed border-gray-300 bg-white/60 px-4 py-3 text-2xs text-gray-500">
          <div className="mb-1 font-medium text-gray-600">Demo hisob</div>
          <div className="plate-glyph">mega@partners.autoparking.uz · mega12345</div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-2xs font-medium text-gray-600">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring h-11 rounded-2lg border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400"
      />
    </label>
  );
}
