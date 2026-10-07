import type { CSSProperties } from 'react';
import { color, radius, space, fontSize } from '../theme/tokens';

/**
 * Lane-monitor status vocabulary (ARCHITECTURE §11.1). Each status carries an
 * icon glyph AND a text label so meaning never depends on color alone
 * (color-blind-safe requirement).
 */
export type Status =
  | 'allowed'
  | 'denied'
  | 'debt'
  | 'paid'
  | 'whitelist'
  | 'blacklist'
  | 'watchlist'
  | 'low_confidence'
  | 'override'
  | 'online'
  | 'degraded'
  | 'offline';

interface Tone {
  fg: string;
  bg: string;
  icon: string;
  label: string;
}

const TONES: Record<Status, Tone> = {
  allowed: { fg: color.success, bg: color.successBg, icon: '✓', label: 'allowed' },
  paid: { fg: color.success, bg: color.successBg, icon: '₴', label: 'paid' },
  whitelist: { fg: color.info, bg: color.infoBg, icon: '★', label: 'whitelist' },
  online: { fg: color.success, bg: color.successBg, icon: '●', label: 'online' },
  denied: { fg: color.danger, bg: color.dangerBg, icon: '✕', label: 'denied' },
  blacklist: { fg: color.danger, bg: color.dangerBg, icon: '⛔', label: 'blacklist' },
  offline: { fg: color.danger, bg: color.dangerBg, icon: '○', label: 'offline' },
  debt: { fg: color.warning, bg: color.warningBg, icon: '!', label: 'debt' },
  low_confidence: { fg: color.warning, bg: color.warningBg, icon: '⚠', label: 'low-conf' },
  watchlist: { fg: color.warning, bg: color.warningBg, icon: '👁', label: 'watch' },
  degraded: { fg: color.warning, bg: color.warningBg, icon: '◐', label: 'degraded' },
  override: { fg: color.brand, bg: color.infoBg, icon: '⤵', label: 'override' },
};

export interface StatusPillProps {
  status: Status;
  /** Override the default label text (e.g. localized string). */
  label?: string;
  style?: CSSProperties;
}

export function StatusPill({ status, label, style }: StatusPillProps) {
  const tone = TONES[status];
  return (
    <span
      role="status"
      aria-label={label ?? tone.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.xs,
        padding: `2px ${space.sm}px`,
        borderRadius: radius.pill,
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.fg}`,
        fontSize: fontSize.xs,
        fontWeight: 700,
        lineHeight: 1.6,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        ...style,
      }}
    >
      <span aria-hidden="true">{tone.icon}</span>
      {label ?? tone.label}
    </span>
  );
}
