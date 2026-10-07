import { useEffect, useMemo, useState } from 'react';
import { store, qrPayload, type Check, type PartnerAccount } from '../store';
import { qrSvg } from '../qr';
import { Receipt } from '../components/Receipt';
import { Wordmark } from '../components/Wordmark';

const DAY = 86_400_000;

function fmt(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function Home({ partner, onLogout }: { partner: PartnerAccount; onLogout: () => void }) {
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<{ check: Check; qr: string } | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);

  useEffect(() => {
    let alive = true;
    void store.listChecks(partner.id).then((list) => {
      if (alive) setChecks(list);
    });
    return () => {
      alive = false;
    };
  }, [partner.id]);

  const recent = useMemo(() => {
    const now = Date.now();
    return checks.filter((c) => now - new Date(c.createdAt).getTime() <= 2 * DAY);
  }, [checks]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const check = await store.issueCheck(partner.id);
      const qr = await qrSvg(qrPayload(check));
      setCurrent({ check, qr });
      setChecks(await store.listChecks(partner.id));
    } finally {
      setBusy(false);
    }
  };

  const openCheck = async (check: Check) => {
    const qr = await qrSvg(qrPayload(check));
    setCurrent({ check, qr });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* top bar */}
      <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Wordmark compact />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">{partner.name}</span>
            <span className="grid h-9 w-9 place-items-center rounded-2lg bg-primary-50 text-sm font-semibold text-primary-700">
              {partner.name.slice(0, 1)}
            </span>
            <button
              onClick={onLogout}
              className="focus-ring rounded-2lg border border-gray-200 bg-white px-3 py-2 text-2xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Chiqish
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* left: generator + receipt */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col items-center rounded-2lg border border-gray-200 bg-white p-8 text-center shadow-card">
              <h1 className="text-lg font-bold text-gray-800">Yangi QR chek</h1>
              <p className="mt-1 max-w-sm text-2xs text-gray-500">
                Tugmani bosing — mijoz uchun noyob QR chek tayyorlanadi.
              </p>
              <button
                onClick={() => void generate()}
                disabled={busy}
                className="focus-ring mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-2lg bg-primary px-10 text-base font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Tayyorlanmoqda…' : '＋ QR yaratish'}
              </button>
            </div>

            {current && (
              <div className="flex flex-col items-center gap-4">
                <Receipt partner={partner} check={current.check} qr={current.qr} />
                <div className="no-print flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="focus-ring inline-flex h-10 items-center rounded-2lg border border-gray-200 bg-white px-4 text-2xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    🖨 Chop etish
                  </button>
                  <button
                    onClick={() => void generate()}
                    disabled={busy}
                    className="focus-ring inline-flex h-10 items-center rounded-2lg bg-primary-50 px-4 text-2xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50"
                  >
                    Yana yaratish
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* right: recent checks */}
          <aside className="no-print">
            <div className="rounded-2lg border border-gray-200 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-700">Chiqarilgan cheklar</h2>
                <span className="rounded-2lg bg-gray-100 px-2 py-0.5 text-exs font-medium text-gray-500">
                  2 kun · {recent.length}
                </span>
              </div>

              {recent.length === 0 ? (
                <div className="px-5 py-10 text-center text-2xs text-gray-400">
                  Hali chek chiqarilmagan
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recent.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => void openCheck(c)}
                        className="focus-ring flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <span className="plate-glyph text-sm font-bold text-gray-800">{c.id}</span>
                        <span className="text-exs text-gray-500">{fmt(c.createdAt)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
