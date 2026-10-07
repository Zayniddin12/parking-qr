/**
 * Design theme — the same tokens ported into `tailwind-preset.cjs`, exposed as a
 * typed JS object for code that needs raw values (charts, inline canvas, tests).
 * Source of truth is DESIGN-ALIGNMENT.md §1 (owner's Vue admin palette).
 */

export const palette = {
  primary: '#4489F7',
  primaryLight: '#EAF2FE',
  primaryDark: '#022F5E',
  success: '#00B67A',
  error: '#EE5253',
  warning: '#F3C63E',
  info: '#1BC5BD',
  sidebar: '#090E14',
  appBg: '#EEF0F8',
  appBg2: '#F6F8FA',
  gray: {
    50: '#F9F9F9',
    100: '#F6F8FA',
    200: '#DCDCE6',
    300: '#EEF2F9',
    400: '#D1D6DC',
    500: '#8E9BA8',
    600: '#596066',
    700: '#3F4254',
  },
} as const;

export const radius = {
  '2lg': '10px',
} as const;

export const shadow = {
  card: '0 3px 20px rgba(18,28,37,.06)',
  header: '0 3px 6px rgba(125,132,141,.06)',
  auth: '0 6px 40px rgba(18,28,37,.06)',
  search: '0 4px 20px rgba(142,155,168,.06)',
} as const;

export const fontFamily = {
  sans: `'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif`,
} as const;

export const theme = {
  palette,
  radius,
  shadow,
  fontFamily,
} as const;

export type Theme = typeof theme;
