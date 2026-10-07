/** AutoParking · Partner wordmark with a small parking-P mark. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-2lg bg-primary text-lg font-black text-white shadow-sm">
        P
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold text-gray-800">AutoParking</span>
          <span className="text-exs font-medium uppercase tracking-[0.18em] text-primary">
            Partner
          </span>
        </span>
      )}
    </span>
  );
}
