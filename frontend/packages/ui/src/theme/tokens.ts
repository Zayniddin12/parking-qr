/**
 * AutoParking design tokens.
 *
 * Placeholder token set for Phase 0. These will be reconciled with the owner's
 * existing Figma variables during the design-alignment pass (ARCHITECTURE §13.4);
 * importing Figma tokens here keeps every app themable from one source.
 *
 * Status colors are ALWAYS paired with an icon + text label at the component
 * layer — never color alone (color-blind-safe requirement, ARCHITECTURE §11.1).
 */

export const color = {
  bg: '#0e1116',
  bgElevated: '#161b22',
  bgInset: '#0a0d12',
  border: '#2b313b',
  borderStrong: '#3a424e',
  text: '#e6edf3',
  textMuted: '#9aa4b2',
  textInverse: '#0e1116',
  brand: '#2f81f7',
  brandStrong: '#1f6feb',
  // Semantic / status palette (lane-monitor pills)
  success: '#2ea043',
  successBg: '#12261a',
  warning: '#d29922',
  warningBg: '#2a2210',
  danger: '#f85149',
  dangerBg: '#2a1416',
  info: '#58a6ff',
  infoBg: '#0f1d2e',
  neutral: '#6e7681',
  neutralBg: '#1b2029',
} as const;

export const space = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  // Large touch/read targets for booth tablets (ARCHITECTURE §11.1).
  plate: 20,
} as const;

export const fontFamily = {
  sans: `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  mono: `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`,
} as const;

export const shadow = {
  card: '0 1px 3px rgba(0,0,0,0.4)',
  overlay: '0 8px 24px rgba(0,0,0,0.6)',
} as const;

/** Minimum interactive target size (px) for booth touchscreens. */
export const touchTarget = 44 as const;

export const tokens = {
  color,
  space,
  radius,
  fontSize,
  fontFamily,
  shadow,
  touchTarget,
} as const;

export type Tokens = typeof tokens;
