/**
 * AutoParking shared Tailwind preset — ported from the owner's Vue admin
 * `tailwind.config.ts` (DESIGN-ALIGNMENT.md §1). Every app consumes this via
 * `presets: [require('@autoparking/ui/tailwind-preset')]` so the React panels
 * match the existing products pixel-for-pixel.
 *
 * Money is unrelated here, but note: brand primary #4489F7, dark sidebar
 * #090E14 (dark.800), signature card/header/auth/search shadows, radius
 * `2lg = 10px`, font Roboto.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      xxl: '1400px',
    },
    extend: {
      colors: {
        // --- brand / semantic ---
        primary: {
          DEFAULT: '#4489F7',
          light: '#EAF2FE',
          dark: '#022F5E',
          50: '#EAF2FE',
          100: '#D6E5FD',
          200: '#AECBFB',
          300: '#85B1F9',
          400: '#5D97F9',
          500: '#4489F7',
          600: '#1F6FE5',
          700: '#155CC4',
          800: '#134FA6',
          900: '#022F5E',
        },
        success: { DEFAULT: '#00B67A', 50: '#E6F7F1', 100: '#C0EBDD', 500: '#00B67A', 600: '#00A06B', 700: '#008A5C' },
        error: { DEFAULT: '#EE5253', 50: '#FDECEC', 100: '#FBD5D5', 200: '#F6ABAB', 500: '#EE5253', 600: '#D93A3B', 700: '#B52C2D', 900: '#7A1E1E' },
        warning: { DEFAULT: '#F3C63E', 50: '#FEF8E5', 100: '#FCEDBB', 500: '#F3C63E', 600: '#DBAE22' },
        info: { DEFAULT: '#1BC5BD', 50: '#E6F9F8', 100: '#BEF0ED', 500: '#1BC5BD', 600: '#14A9A2' },
        // --- greys (ported verbatim, DESIGN-ALIGNMENT §1) ---
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
        // --- blues ---
        blue: {
          50: '#EAF2FE',
          100: '#D6E5FD',
          200: '#AECBFB',
          300: '#85B1F9',
          400: '#5D97F9',
          500: '#4489F7',
          600: '#1F6FE5',
          700: '#155CC4',
          800: '#022F5E',
        },
        // --- reds ---
        red: {
          50: '#FDECEC',
          100: '#FBD5D5',
          200: '#F6ABAB',
          300: '#F28181',
          400: '#F06A6B',
          500: '#EE5253',
          600: '#D93A3B',
          700: '#B52C2D',
          800: '#901F20',
          900: '#7A1E1E',
        },
        // --- greens ---
        green: {
          50: '#E6F7F1',
          100: '#C0EBDD',
          200: '#96DEC6',
          300: '#6BD0AF',
          400: '#4BC69D',
          500: '#00B67A',
          600: '#00A06B',
          700: '#008A5C',
        },
        // --- darks (sidebar) ---
        dark: {
          600: '#141B24',
          700: '#0E1420',
          800: '#090E14',
          900: '#05080C',
        },
        // --- app backgrounds ---
        app: '#EEF0F8',
        'app-2': '#F6F8FA',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        exs: ['10px', { lineHeight: '16px' }],
        '2xs': ['13px', { lineHeight: '18px' }],
        '3.5xl': ['32px', { lineHeight: '40px' }],
        '4.5xl': ['40px', { lineHeight: '48px' }],
      },
      lineHeight: {
        16: '16px',
        18: '18px',
        19: '19px',
        20.8: '20.8px',
        22: '22px',
        24: '24px',
        110: '110%',
        130: '130%',
        140: '140%',
        150: '150%',
      },
      borderRadius: {
        '2lg': '10px',
      },
      boxShadow: {
        card: '0 3px 20px rgba(18,28,37,.06)',
        header: '0 3px 6px rgba(125,132,141,.06)',
        auth: '0 6px 40px rgba(18,28,37,.06)',
        search: '0 4px 20px rgba(142,155,168,.06)',
      },
      transitionProperty: {
        width: 'width',
      },
    },
  },
  plugins: [],
};
