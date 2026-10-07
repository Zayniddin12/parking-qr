import { cn } from '../lib/cn';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  className?: string;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

/** Circular avatar with image or initials fallback. */
export function Avatar({ name, src, size = 32, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-2xs font-semibold text-primary-700',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={name ? undefined : true}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
