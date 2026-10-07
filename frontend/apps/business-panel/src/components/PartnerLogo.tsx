/** Partner avatar: uploaded logo, or brand-tinted initials when none. */
export function PartnerLogo({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-2lg border border-gray-200 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-2lg bg-primary-50 font-semibold text-primary-700"
      style={{ width: size, height: size, fontSize: Math.round(size / 2.6) }}
    >
      {initials || '•'}
    </span>
  );
}
