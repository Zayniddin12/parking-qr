import type { Check, PartnerAccount } from '../store';

function fmt(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** The issued QR receipt — the physical artifact the visitor keeps. Styled to
 *  print cleanly on a narrow thermal/A6 slip (see `.print-area` in styles.css). */
export function Receipt({
  partner,
  check,
  qr,
}: {
  partner: PartnerAccount;
  check: Check;
  qr: string;
}) {
  return (
    <div className="print-area animate-pop mx-auto w-full max-w-[340px] rounded-2lg border border-gray-200 bg-white shadow-auth">
      <div className="flex flex-col items-center gap-1 px-6 pt-6 text-center">
        <div className="text-exs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Validatsiya cheki
        </div>
        <div className="text-lg font-bold text-gray-800">{partner.name}</div>
      </div>

      <div className="my-4 flex justify-center">
        <span className="plate-glyph rounded-lg border border-gray-200 bg-gray-50 px-5 py-2 text-2xl font-bold tracking-wider text-gray-800">
          {check.id}
        </span>
      </div>

      <div className="mx-6 rounded-2lg border border-gray-200 bg-white p-3">
        <div className="qrbox mx-auto w-44" dangerouslySetInnerHTML={{ __html: qr }} />
      </div>

      <div className="px-6 py-4">
        <Row label="Sana" value={fmt(check.createdAt)} />
        <Row
          label="Bepul turargoh"
          value={<span className="font-semibold text-primary">{partner.freeMinutes} daqiqa</span>}
        />
      </div>

      {partner.note && (
        <div className="mx-6 mb-2 rounded-2lg bg-primary-50 px-3 py-2 text-center text-2xs text-primary-800">
          {partner.note}
        </div>
      )}

      {/* perforated edge for receipt feel */}
      <div className="mt-2 border-t border-dashed border-gray-300" />
      <div className="flex items-center justify-center gap-1.5 px-6 py-3 text-exs text-gray-400">
        <span className="inline-block h-3 w-3 rounded-[3px] bg-primary" />
        AutoParking · avtoturargoh tizimi
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
